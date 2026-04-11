const Notice = require('../models/Notice');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');

const FAQ = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'howdy'],
  attendance: ['attendance', 'present', 'absent', 'percentage', 'classes'],
  assignment: ['assignment', 'homework', 'task', 'submission', 'deadline', 'due'],
  notice: ['notice', 'announcement', 'news', 'update', 'circular'],
  schedule: ['schedule', 'timetable', 'class timing', 'lecture'],
  exam: ['exam', 'test', 'examination', 'paper', 'marks', 'result', 'grade'],
  library: ['library', 'book', 'borrow', 'return', 'reading'],
  help: ['help', 'support', 'assist', 'guide', 'what can you do'],
  contact: ['contact', 'phone', 'email', 'reach', 'faculty'],
};

const responses = {
  greeting: [
    "Hello! Welcome to Smart Campus Assistant 👋 How can I help you today?",
    "Hey there! I'm your Smart Campus AI Assistant. Ask me anything about your campus!",
  ],
  attendance: null, // handled dynamically
  assignment: null, // handled dynamically
  notice: null,     // handled dynamically
  schedule: "📅 Class schedules are updated by faculty. Please check the Schedule section or contact your class coordinator for timing details.",
  exam: "📝 Exam schedules and results are posted in the Notices section. Check for 'Exam' category notices for updates! You can also contact your faculty directly.",
  library: "📚 Library hours: Mon-Fri 8AM-8PM, Sat 9AM-5PM. For book availability, contact the library at library@campus.edu or visit in person.",
  help: "🤖 I can help you with:\n• Checking attendance records\n• Finding assignments & deadlines\n• Reading notices & announcements\n• Campus policies and FAQs\n• Contacting faculty\nJust ask!",
  contact: "📞 For faculty contact, visit the Faculty Directory on your portal. For admin: admin@smartcampus.edu | Helpdesk: +91-9999999999",
  default: "I'm not sure about that. Try asking about attendance, assignments, notices, exams, or library. You can also contact campus support! 😊",
};

const matchIntent = (message) => {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(FAQ)) {
    if (keywords && keywords.some((kw) => lower.includes(kw))) {
      return intent;
    }
  }
  return 'default';
};

// @desc   Chat with bot
// @route  POST /api/chatbot/message
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const intent = matchIntent(message);
    let reply = '';
    let data = null;

    switch (intent) {
      case 'greeting': {
        const greetings = responses.greeting;
        reply = greetings[Math.floor(Math.random() * greetings.length)];
        break;
      }

      case 'attendance': {
        if (user.role === 'student') {
          const records = await Attendance.find({ student: user._id });
          const summary = {};
          records.forEach((r) => {
            if (!summary[r.subject]) summary[r.subject] = { present: 0, total: 0 };
            if (r.status === 'present' || r.status === 'late') summary[r.subject].present++;
            summary[r.subject].total++;
          });

          if (Object.keys(summary).length === 0) {
            reply = "📊 No attendance records found yet. Attend classes to see your record!";
          } else {
            const lines = Object.entries(summary).map(([subj, s]) => {
              const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
              const emoji = pct >= 75 ? '✅' : '⚠️';
              return `${emoji} ${subj}: ${pct}% (${s.present}/${s.total})`;
            });
            reply = `📊 Your Attendance Summary:\n${lines.join('\n')}\n\n${
              lines.some((l) => l.includes('⚠️')) ? '⚠️ Warning: Some subjects below 75%!' : '✅ Attendance looks good!'
            }`;
            data = { type: 'attendance', summary };
          }
        } else {
          reply = "As faculty, you can view attendance analytics in your dashboard.";
        }
        break;
      }

      case 'assignment': {
        let query = { isActive: true };
        if (user.role === 'student') {
          query.department = user.department;
          query.semester = user.semester;
        } else {
          query.faculty = user._id;
        }

        const assignments = await Assignment.find(query)
          .sort({ dueDate: 1 })
          .limit(5)
          .populate('faculty', 'name');

        if (assignments.length === 0) {
          reply = "📚 No pending assignments found! You're all caught up. 🎉";
        } else {
          const lines = assignments.map((a) => {
            const due = new Date(a.dueDate);
            const isOverdue = due < new Date();
            const emoji = isOverdue ? '🔴' : '🟡';
            return `${emoji} ${a.title} (${a.subject}) - Due: ${due.toLocaleDateString()}`;
          });
          reply = `📚 Upcoming Assignments:\n${lines.join('\n')}\n\nCheck the Assignments section to download files!`;
          data = { type: 'assignments', count: assignments.length };
        }
        break;
      }

      case 'notice': {
        const notices = await Notice.find({ isActive: true })
          .sort({ isPinned: -1, createdAt: -1 })
          .limit(3)
          .populate('author', 'name');

        if (notices.length === 0) {
          reply = "📢 No recent notices found.";
        } else {
          const lines = notices.map((n) => `${n.isPinned ? '📌' : '📄'} [${n.category.toUpperCase()}] ${n.title}`);
          reply = `📢 Recent Notices:\n${lines.join('\n')}\n\nVisit the Notices section for full details!`;
          data = { type: 'notices', count: notices.length };
        }
        break;
      }

      default: {
        reply = responses[intent] || responses.default;
        break;
      }
    }

    res.json({ success: true, reply, data, intent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get quick suggestions
// @route  GET /api/chatbot/suggestions
exports.getSuggestions = async (req, res) => {
  const suggestions = [
    "Check my attendance",
    "Show pending assignments",
    "Latest notices",
    "Library timings",
    "Exam schedule",
    "How can you help?",
  ];
  res.json({ success: true, suggestions });
};
