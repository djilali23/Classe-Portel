// ======================================
// Firebase - إعداد الاتصال
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
// إعدادات مشروع Classe Portel
const firebaseConfig = {
  apiKey: "AIzaSyCMpuHsFC_OsgTzgu51Ej_ZQmdIFVlWheI",
  authDomain: "classe-portel.firebaseapp.com",
  projectId: "classe-portel",
  storageBucket: "classe-portel.firebasestorage.app",
  messagingSenderId: "257098192729",
  appId: "1:257098192729:web:d31d67785e72b9b081de48",
  measurementId: "G-M5C9TGX5PJ",
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// المصادقة وقاعدة البيانات
const auth = getAuth(app);
const db = getFirestore(app);
// ======================================
// متغيرات الحساب والدردشة
// ======================================

let currentUser = null;
let currentUsername = "";
let unsubscribeMessages = null;

let unsubscribeAssignments = null;
let editingAssignmentId = null;

const ADMIN_UIDS = ["AOYSP0TvU2husaKxHU552bwUUHb2"];

function isCurrentAdmin() {
  return currentUser && ADMIN_UIDS.includes(currentUser.uid);
}
console.log("Firebase initialized successfully!");

/* =====================================================
   1) معلومات القسم (عدّلها)
   ===================================================== */
const INFO = [
  ["القسم", "السنة أولى ثانوي - شعبة الأداب"],
  ["الثانوية", "ثانوية المجاهد المرحوم مول الكاف أحمد"],
  ["الأستاذ الرئيسي", "العلوم الإسلامية"],
  ["المندوب", "بو شقور رهف هديل     شامخة وليد"],
  ["إعداد", "رحيم جيلالي"],
];

/* =====================================================
   2) أسماء التلاميذ  ← املأها هنا
   كل تلميذ سطر:  { n: "الاسم", g: "boy" },
   g = "boy" للذكر  أو  "girl" للأنثى
   ===================================================== */
const STUDENTS = [
  // { n:  "", g: "boy" },
  // { n: "", g: "girl" },
  { n: "رحيم جيلالي", g: "boy" },
  { n: "بو شاقور رهف هديل", g: "girl" },
  { n: "العنتري عبد الرحمان", g: "boy" },
  { n: "طاوش إيمان", g: "girl" },
  { n: "شامخة وليد", g: "boy" },
  { n: "بوذة ملاك إناس", g: "girl" },
  { n: "رحو علاء الدين", g: "boy" },
  { n: "بن سعدة خولة", g: "girl" },
  { n: "بو خبزة عبد الحق", g: "boy" },
  { n: "رحال ملاك", g: "girl" },
  { n: "بن عدة سماعيل", g: "boy" },
  { n: "منور ملاك", g: "girl" },
  { n: "جبار عبد الإله", g: "boy" },
  { n: "حبشاوي فراح", g: "girl" },
  { n: "بن سيد حمد فوضيل", g: "boy" },
  { n: "بو عبد الله اللعالية", g: "girl" },
  { n: "بالحميدة محمد الأمين", g: "boy" },
  { n: "بالمرخي إيناس", g: "girl" },
  { n: "بخدة تاج الدين", g: "boy" },
  { n: "رايس ويسام", g: "girl" },
  { n: "بلجة عبد الباسط", g: "boy" },
  { n: "محمود نصيرة", g: "girl" },
  { n: "بو مجوط شرف الدين", g: "boy" },
  { n: "بن قانة أية", g: "girl" },
];

/* =====================================================
   3) جدول استعمال الزمن
   كل حصة: [البداية, النهاية, المادة]
   - المادة نص عادي
   - null  = ساعة فارغة
   - قائمة [ "مادة 1", "مادة 2" ] = أفواج
   idx: الأحد 0 ... الخميس 4
   ===================================================== */
const TIMETABLE = [
  {
    day: "الأحد",
    idx: 0,
    morning: [
      ["08:00", "10:00", "لغة عربية"],
      ["10:00", "12:00", "رياضة"],
    ],
    afternoon: [
      ["13:30", "14:30", "علوم إسلامية"],
      ["14:30", "15:30", "رياضيات"],
      ["15:30", "16:30", null],
    ],
  },
  {
    day: "الاثنين",
    idx: 1,
    morning: [
      ["08:00", "10:00", "لغة فرنسية"],
      ["10:00", "12:00", "لغة إنجليزية"],
    ],
    afternoon: [
      ["13:30", "14:30", "علوم طبيعية"],
      ["14:30", "15:30", "الإعلام الآلي"],
      ["15:30", "16:30", "تاريخ"],
    ],
  },
  {
    day: "الثلاثاء",
    idx: 2,
    morning: [
      ["08:00", "10:00", "لغة عربية"],
      ["10:00", "12:00", "رياضيات"],
    ],
    afternoon: [
      ["13:30", "15:30", ["علوم طبيعية", "علوم فيزيائية"]],
      ["15:30", "16:30", "تاريخ"],
    ],
  },
  {
    day: "الأربعاء",
    idx: 3,
    morning: [
      ["08:00", "10:00", ["لغة عربية", "الإعلام الآلي"]],
      ["10:00", "12:00", "لغة فرنسية"],
    ],
    afternoon: [
      ["13:30", "14:30", "جغرافيا"],
      ["14:30", "15:30", "لغة إنجليزية"],
      ["15:30", "16:30", "علوم إسلامية"],
    ],
  },
  {
    day: "الخميس",
    idx: 4,
    morning: [
      ["08:00", "09:00", "لغة عربية"],
      ["09:00", "10:00", "لغة إنجليزية"],
      ["10:00", "11:00", "علوم فيزيائية"],
      ["11:00", "12:00", "جغرافيا"],
    ],
    afternoon: [], // لا دراسة مساءً
  },
];

const ICONS = {
  "لغة عربية": "📖",
  رياضة: "⚽",
  "علوم إسلامية": "🕌",
  رياضيات: "📐",
  "لغة فرنسية": "📝",
  "لغة إنجليزية": "💬",
  "علوم طبيعية": "🌿",
  "الإعلام الآلي": "💻",
  تاريخ: "🏛️",
  "علوم فيزيائية": "⚗️",
  جغرافيا: "🌍",
};

/* =====================================================
   أدوات
   ===================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const label = (s) => (Array.isArray(s) ? s.join(" / ") : s);
const allSlots = (d) => [...d.morning, ...d.afternoon];

function dur(a, b) {
  const m = toMin(b) - toMin(a);
  if (m === 60) return "ساعة";
  if (m === 120) return "ساعتان";
  if (m % 60 === 0) return `${m / 60} ساعات`;
  return `${m} دقيقة`;
}
function nowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
/* =====================================================
   التبويبات
   ===================================================== */

function showTab(name) {
  if (!currentUser && name !== "authSection") {
    name = "authSection";
  }

  $$("#tabs button").forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === name),
  );

  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === name));

  history.replaceState(null, "", "#" + name);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =====================================================
   نظام الدردشة - Classe Portel
   ===================================================== */

// رسائل الحالة
function showChatNotice(message, isError = false) {
  const notice = $("#chatNotice");

  if (!notice) return;

  notice.textContent = message;
  notice.classList.toggle("error", isError);
}

// تنسيق الوقت
function formatMessageTime(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return "الآن";
  }

  return timestamp.toDate().toLocaleTimeString("ar-DZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// إيقاف مراقبة الرسائل
function stopChatListener() {
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
}

// عرض الرسائل
function renderChatMessages(snapshot) {
  const box = $("#chatMessages");

  if (!box) return;

  box.replaceChildren();

  if (snapshot.empty) {
    box.append(
      el("p", "chat-empty", "لا توجد رسائل بعد. كن أول من يبدأ النقاش!"),
    );
    return;
  }

  const messages = [...snapshot.docs].reverse();

  messages.forEach((messageDoc) => {
    const message = messageDoc.data();

    const own = currentUser && message.userId === currentUser.uid;

    const row = el("div", "chat-message" + (own ? " own" : ""));

    const bubble = el("div", "chat-bubble");
    const header = el("div", "chat-message-head");

    header.append(
      el("strong", "chat-author", message.username || "تلميذ"),
      el("time", "chat-time", formatMessageTime(message.createdAt)),
    );

    bubble.append(header);

    bubble.append(el("p", "chat-message-text", message.text || ""));

    // حذف الرسائل للمسؤول فقط
    if (isCurrentAdmin()) {
      const deleteBtn = el("button", "chat-delete", "حذف");

      deleteBtn.type = "button";

      deleteBtn.addEventListener("click", async () => {
        if (!isCurrentAdmin()) return;

        if (!confirm("هل تريد حذف هذه الرسالة؟")) return;

        deleteBtn.disabled = true;

        try {
          await deleteDoc(doc(db, "messages", messageDoc.id));

          showChatNotice("تم حذف الرسالة.");
        } catch (error) {
          console.error(error);

          showChatNotice("تعذر حذف الرسالة.", true);

          deleteBtn.disabled = false;
        }
      });

      bubble.append(deleteBtn);
    }

    row.append(bubble);
    box.append(row);
  });

  box.scrollTop = box.scrollHeight;
}

// تشغيل مراقبة الرسائل
function startChatListener() {
  if (!currentUser) return;

  const box = $("#chatMessages");

  if (!box) return;

  stopChatListener();

  box.replaceChildren(el("p", "chat-empty", "جار تحميل الرسائل..."));

  const messagesQuery = query(
    collection(db, "messages"),
    orderBy("createdAt", "desc"),
    limit(100),
  );

  unsubscribeMessages = onSnapshot(
    messagesQuery,

    (snapshot) => {
      renderChatMessages(snapshot);
    },

    (error) => {
      console.error("Chat listener error:", error);

      showChatNotice("تعذر تحميل الرسائل. تحقق من الاتصال والقواعد.", true);

      box.replaceChildren(el("p", "chat-empty", "تعذر تحميل المحادثة."));
    },
  );
}

// إرسال رسالة
async function sendChatMessage(event) {
  event.preventDefault();

  const input = $("#chatInput");
  const sendBtn = $("#chatSendBtn");

  const messageText = input.value.trim();

  if (!messageText) return;

  if (!currentUser || !currentUsername) {
    showChatNotice("يجب تسجيل الدخول أولاً.", true);
    return;
  }

  sendBtn.disabled = true;

  try {
    await addDoc(collection(db, "messages"), {
      userId: currentUser.uid,
      username: currentUsername,
      text: messageText,
      createdAt: serverTimestamp(),
    });

    input.value = "";
    showChatNotice("تم إرسال رسالتك بنجاح.");
  } catch (error) {
    console.error("Sending message failed:", error);

    showChatNotice("تعذر إرسال الرسالة. تحقق من الاتصال والصلاحيات.", true);
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

// ربط نموذج الدردشة
const chatForm = $("#chatForm");
const chatInput = $("#chatInput");

if (chatForm) {
  chatForm.addEventListener("submit", sendChatMessage);
}

if (chatInput && chatForm) {
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chatForm.requestSubmit();
    }
  });
}
/* =====================================================
   نظام الواجبات - Classe Portel
   ===================================================== */

// عناصر الواجهة
const assignmentForm = $("#assignmentForm");
const assignmentList = $("#assignmentsList");
const assignmentSubmitBtn = $("#publishAssignmentBtn");
const assignmentCancelBtn = $("#cancelAssignmentEdit");

// التاريخ المحلي بصيغة YYYY-MM-DD
function getLocalToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// عرض رسالة الحالة
function showAssignmentNotice(message, isError = false) {
  const notice = $("#assignmentNotice");

  if (!notice) return;

  notice.textContent = message;
  notice.classList.toggle("error", isError);
}

// تنسيق تاريخ التسليم
function formatAssignmentDate(value) {
  if (!value) return "غير محدد";

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Date(year, month - 1, day).toLocaleDateString("ar-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// تنسيق تاريخ النشر
function formatAssignmentCreatedAt(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return "الآن";
  }

  return timestamp.toDate().toLocaleDateString("ar-DZ", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// إيقاف مراقبة الواجبات
function stopAssignmentsListener() {
  if (unsubscribeAssignments) {
    unsubscribeAssignments();
    unsubscribeAssignments = null;
  }
}

// إعادة النموذج لوضع النشر
function resetAssignmentForm() {
  assignmentForm.reset();

  editingAssignmentId = null;

  assignmentSubmitBtn.textContent = "📤 نشر الواجب";

  assignmentCancelBtn.hidden = true;
}

// عرض الواجبات
function renderAssignments(snapshot) {
  assignmentList.replaceChildren();

  if (snapshot.empty) {
    assignmentList.append(
      el(
        "div",
        "card soon",
        "📚 لا توجد واجبات منشورة حتى الآن."
      )
    );
    return;
  }

  snapshot.docs.forEach((assignmentDoc) => {
    const assignment = assignmentDoc.data();

    const card = el("article", "assignment-card");

    // العنوان والمادة
    const head = el("div", "assignment-card-head");

    head.append(
      el("h3", "assignment-title", assignment.title),
      el("span", "assignment-subject", assignment.subject)
    );

    card.append(head);

    // تفاصيل الواجب
    card.append(
      el(
        "p",
        "assignment-description",
        assignment.description
      )
    );

    // معلومات الواجب
    const meta = el("div", "assignment-meta");

    meta.append(
      el(
        "span",
        "",
        "📅 التسليم: " +
          formatAssignmentDate(assignment.dueDate)
      ),
      el(
        "span",
        "",
        "👤 نشره: " + (assignment.createdByName || "تلميذ")
      ),
      el(
        "span",
        "",
        "🕒 تاريخ النشر: " +
          formatAssignmentCreatedAt(assignment.createdAt)
      )
    );

    card.append(meta);

    // صلاحيات صاحب الواجب والمسؤول
    const canManage = currentUser &&
      (
        isCurrentAdmin() ||
        assignment.createdBy === currentUser.uid
      );

    if (canManage) {
      const actions = el("div", "assignment-actions");

      // زر التعديل
      const editBtn = el(
        "button",
        "assignment-edit",
        "✏️ تعديل"
      );

      editBtn.type = "button";

      editBtn.addEventListener("click", () => {
        editingAssignmentId = assignmentDoc.id;

        $("#assignmentTitle").value = assignment.title;
        $("#assignmentSubject").value = assignment.subject;
        $("#assignmentDescription").value = assignment.description;
        $("#assignmentDueDate").value = assignment.dueDate;

        assignmentSubmitBtn.textContent = "💾 حفظ التعديلات";
        assignmentCancelBtn.hidden = false;

        showAssignmentNotice(
          "أنت الآن تعدّل هذا الواجب."
        );

        assignmentForm.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        $("#assignmentTitle").focus();
      });

      // زر الحذف
      const deleteBtn = el(
        "button",
        "assignment-delete",
        "🗑️ حذف"
      );

      deleteBtn.type = "button";

      deleteBtn.addEventListener("click", async () => {
        if (
          !currentUser ||
          !(
            isCurrentAdmin() ||
            assignment.createdBy === currentUser.uid
          )
        ) {
          return;
        }

        if (!confirm("هل تريد حذف هذا الواجب؟")) return;

        deleteBtn.disabled = true;

        try {
          await deleteDoc(
            doc(db, "assignments", assignmentDoc.id)
          );

          if (editingAssignmentId === assignmentDoc.id) {
            resetAssignmentForm();
          }

          showAssignmentNotice("تم حذف الواجب بنجاح.");

        } catch (error) {
          console.error("Assignment deletion failed:", error);

          showAssignmentNotice(
            "تعذر حذف الواجب. تحقق من صلاحياتك.",
            true
          );

          deleteBtn.disabled = false;
        }
      });

      actions.append(editBtn, deleteBtn);
      card.append(actions);
    }

    assignmentList.append(card);
  });
}

// تشغيل المراقبة المباشرة
function startAssignmentsListener() {
  if (!currentUser) return;

  stopAssignmentsListener();

  assignmentList.replaceChildren(
    el("div", "card soon", "جار تحميل الواجبات...")
  );

  const assignmentsQuery = query(
    collection(db, "assignments"),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  unsubscribeAssignments = onSnapshot(
    assignmentsQuery,

    (snapshot) => {
      renderAssignments(snapshot);
    },

    (error) => {
      console.error("Assignments listener error:", error);

      assignmentList.replaceChildren(
        el(
          "div",
          "card soon",
          "تعذر تحميل الواجبات. تحقق من الاتصال والقواعد."
        )
      );
    }
  );
}

// نشر واجب أو حفظ التعديلات
async function saveAssignment(event) {
  event.preventDefault();

  if (!currentUser || !currentUsername) {
    showAssignmentNotice(
      "يجب تسجيل الدخول أولاً.",
      true
    );
    return;
  }

  const title = $("#assignmentTitle").value.trim();
  const subject = $("#assignmentSubject").value;
  const description = $("#assignmentDescription").value.trim();
  const dueDate = $("#assignmentDueDate").value;

  if (!title || !subject || !description || !dueDate) {
    showAssignmentNotice(
      "يرجى ملء جميع الحقول.",
      true
    );
    return;
  }

  if (dueDate < getLocalToday()) {
    showAssignmentNotice(
      "تاريخ التسليم يجب ألا يكون في الماضي.",
      true
    );
    return;
  }

  assignmentSubmitBtn.disabled = true;

  try {
    if (editingAssignmentId) {

      // تعديل واجب موجود
      await updateDoc(
        doc(db, "assignments", editingAssignmentId),
        {
          title: title,
          subject: subject,
          description: description,
          dueDate: dueDate
        }
      );

      resetAssignmentForm();

      showAssignmentNotice(
        "تم تحديث الواجب بنجاح."
      );

    } else {

      // نشر واجب جديد
      await addDoc(collection(db, "assignments"), {
        title: title,
        subject: subject,
        description: description,
        dueDate: dueDate,
        createdBy: currentUser.uid,
        createdByName: currentUsername,
        createdAt: serverTimestamp()
      });

      resetAssignmentForm();

      showAssignmentNotice(
        "تم نشر الواجب بنجاح! 🎉"
      );
    }

  } catch (error) {
    console.error("Saving assignment failed:", error);

    showAssignmentNotice(
      "تعذر حفظ الواجب. تحقق من الاتصال وقواعد Firestore.",
      true
    );

  } finally {
    assignmentSubmitBtn.disabled = false;
  }
}

// ربط النموذج
if (assignmentForm) {
  assignmentForm.addEventListener("submit", saveAssignment);
}

// إلغاء التعديل
if (assignmentCancelBtn) {
  assignmentCancelBtn.addEventListener("click", () => {
    resetAssignmentForm();
    showAssignmentNotice("تم إلغاء التعديل.");
  });
}

// منع اختيار تاريخ تسليم قديم
const assignmentDueDate = $("#assignmentDueDate");

if (assignmentDueDate) {
  assignmentDueDate.min = getLocalToday();
}

/* =====================================================
   الرئيسية
   ===================================================== */
function renderInfo() {
  const g = $("#infoGrid");
  g.replaceChildren();
  INFO.forEach(([k, v]) => {
    const c = el("div", "card tilt info-item");
    c.append(el("b", "", k), el("span", "", v));
    g.append(c);
  });
}

function renderNow() {
  const box = $("#nowBox");
  const today = new Date().getDay();
  const d = TIMETABLE.find((x) => x.idx === today);
  const min = nowMinutes();
  box.className = "now";

  $("#statDay").textContent = DAY_NAMES[today];
  $("#statStudents").textContent = STUDENTS.length;
  $("#statToday").textContent = d ? allSlots(d).filter((s) => s[2]).length : 0;

  if (!d) {
    box.textContent = "🎉 لا دراسة اليوم، عطلة سعيدة";
    return;
  }

  const slots = allSlots(d).filter((s) => s[2]);
  const cur = slots.find((s) => min >= toMin(s[0]) && min < toMin(s[1]));
  if (cur) {
    box.classList.add("live");
    box.textContent = `🟢 الآن: ${label(cur[2])} (حتى ${cur[1]})`;
    return;
  }
  const next = slots.find((s) => toMin(s[0]) > min);
  box.textContent = next
    ? `⏭️ الحصة القادمة: ${label(next[2])} على ${next[0]}`
    : "✅ انتهت حصص اليوم";
}

/* =====================================================
   الجدول
   ===================================================== */
function slotEl(s, isToday, min) {
  const [st, en, sub] = s;
  const live = isToday && min >= toMin(st) && min < toMin(en);
  const empty = sub === null;
  const grp = Array.isArray(sub);

  const row = el(
    "div",
    "slot" +
      (live ? " live" : "") +
      (empty ? " empty" : "") +
      (grp ? " groups" : ""),
  );
  const time = el("div", "time");
  time.append(el("b", "", st), el("i", "", en));

  const body = el("div", "body");
  if (grp) {
    body.append(el("div", "grp-title", "أفواج • " + dur(st, en)));
    const chips = el("div", "chips");
    sub.forEach((x) => {
      const c = el("span", "chip");
      c.append(el("span", "", ICONS[x] || "📘"), document.createTextNode(x));
      chips.append(c);
    });
    body.append(chips);
  } else {
    const tx = el("div");
    tx.append(
      el("div", "subj", empty ? "فراغ" : sub),
      el("small", "", dur(st, en)),
    );
    body.append(el("span", "ic", empty ? "☕" : ICONS[sub] || "📘"), tx);
  }
  if (live) body.append(el("span", "live-tag", "الآن"));

  row.append(time, body);
  return row;
}

function renderTimetable() {
  const list = $("#ttList");
  list.replaceChildren();
  const today = new Date().getDay();
  const min = nowMinutes();

  TIMETABLE.forEach((d) => {
    const isToday = d.idx === today;
    const card = el("div", "day tilt" + (isToday ? " today" : ""));

    const head = el("div", "day-head");
    head.append(el("h3", "", d.day));
    if (isToday) head.append(el("span", "today-tag", "اليوم"));
    card.append(head);

    card.append(el("div", "period", "☀️ الفترة الصباحية"));
    d.morning.forEach((s) => card.append(slotEl(s, isToday, min)));

    card.append(el("div", "period", "🌙 الفترة المسائية"));
    if (d.afternoon.length)
      d.afternoon.forEach((s) => card.append(slotEl(s, isToday, min)));
    else card.append(el("div", "noclass", "لا دراسة مساءً"));

    list.append(card);
  });
}

/* =====================================================
   التلاميذ
   ===================================================== */
function renderStudents(filter = "") {
  const g = $("#studentGrid");
  g.replaceChildren();
  $("#studentCount").textContent = STUDENTS.length;

  if (!STUDENTS.length) {
    g.append(
      el(
        "p",
        "empty",
        "لم تُضف أسماء بعد. افتح script.js وأضفها في القائمة STUDENTS.",
      ),
    );
    return;
  }
  const list = STUDENTS.filter((s) => s.n.includes(filter.trim()));
  if (!list.length) {
    g.append(el("p", "empty", "لا نتائج"));
    return;
  }

  list.forEach((s) => {
    const c = el("div", "student tilt " + s.g);
    c.append(
      el("span", "ic", s.g === "girl" ? "👧" : "👦"),
      el("span", "", s.n),
    );
    g.append(c);
  });
}
$("#studentSearch").addEventListener("input", (e) =>
  renderStudents(e.target.value),
);

/* =====================================================
   تأثير الميلان ثلاثي الأبعاد (للشاشات التي فيها مؤشر)
   ===================================================== */
if (matchMedia("(hover:hover)").matches) {
  document.addEventListener("pointermove", (e) => {
    const c = e.target.closest(".tilt");
    $$(".tilt.tilting").forEach((x) => {
      if (x !== c) {
        x.classList.remove("tilting");
        x.style.transform = "";
      }
    });
    if (!c) return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    c.classList.add("tilting");
    c.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg) translateZ(6px)`;
  });
}

/* =====================================================
   بدء التشغيل
   ===================================================== */
function renderAll() {
  renderInfo();
  renderNow();
  renderTimetable();
  renderStudents($("#studentSearch").value);
}
renderAll();

// تحديث الحصة الجارية كل دقيقة
setInterval(() => {
  renderNow();
  renderTimetable();
}, 60000);

showTab("home");

// ===== التنقل بين تسجيل الدخول وإنشاء الحساب =====

// ======================================
// نظام الحسابات - Classe Portel
// ======================================

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

const showSignupBtn = document.getElementById("showSignup");
const showLoginBtn = document.getElementById("showLogin");

const authMessage = document.getElementById("authMessage");

let registrationInProgress = false;

// زر تسجيل الخروج
const logoutBtn = document.createElement("button");
logoutBtn.textContent = "تسجيل الخروج";
logoutBtn.hidden = true;
document.getElementById("authSection").append(logoutBtn);

// تحويل اسم المستخدم إلى بريد داخلي
function usernameToEmail(username) {
  return username.toLowerCase() + "@class.local";
}

// رسائل الأخطاء
function authError(error) {
  console.error(error);

  if (error.code === "auth/email-already-in-use") {
    return "اسم المستخدم مستخدم بالفعل.";
  }

  if (error.code === "auth/weak-password") {
    return "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.";
  }

  if (error.code === "auth/invalid-credential") {
    return "اسم المستخدم أو كلمة المرور غير صحيحة.";
  }

  if (error.code === "auth/invalid-email") {
    return "اسم المستخدم غير صالح.";
  }

  if (
    error.code === "permission-denied" ||
    error.code === "firestore/permission-denied"
  ) {
    return "رمز الدعوة غير صحيح أو تعذر التحقق منه.";
  }

  return "حدث خطأ. حاول مرة أخرى.";
}

// الانتقال بين التسجيل والدخول
showSignupBtn.addEventListener("click", () => {
  loginForm.hidden = true;
  signupForm.hidden = false;
  authMessage.textContent = "";
});

showLoginBtn.addEventListener("click", () => {
  signupForm.hidden = true;
  loginForm.hidden = false;
  authMessage.textContent = "";
});

// إنشاء حساب جديد
signupBtn.addEventListener("click", async () => {
  const username = document
    .getElementById("signupUsername")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("signupPassword").value;
  const inviteCode = document.getElementById("inviteCode").value.trim();

  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    authMessage.textContent =
      "اسم المستخدم يجب أن يحتوي على 3 إلى 20 حرفًا أو رقمًا.";
    return;
  }

  if (password.length < 6) {
    authMessage.textContent = "كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.";
    return;
  }

  if (!inviteCode) {
    authMessage.textContent = "أدخل رمز الدعوة.";
    return;
  }

  signupBtn.disabled = true;
  authMessage.textContent = "جارٍ إنشاء الحساب...";

  let credential = null;
  registrationInProgress = true;

  try {
    credential = await createUserWithEmailAndPassword(
      auth,
      usernameToEmail(username),
      password,
    );

    const uid = credential.user.uid;

    // التحقق من رمز الدعوة
    await setDoc(doc(db, "inviteClaims", uid), {
      code: inviteCode,
      createdAt: serverTimestamp(),
    });

    // إنشاء ملف الطالب
    await setDoc(doc(db, "users", uid), {
      username: username,
      role: "student",
      createdAt: serverTimestamp(),
    });

currentUser = credential.user;
currentUsername = username;

startChatListener();
startAssignmentsListener();

registrationInProgress = false;

    loginForm.hidden = true;
    signupForm.hidden = true;
    logoutBtn.hidden = false;

    authMessage.textContent = "مرحبًا " + username + "، تم إنشاء حسابك بنجاح!";

    showTab("home");

    document.getElementById("signupUsername").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("inviteCode").value = "";
  } catch (error) {
    if (credential && credential.user) {
      try {
        await deleteUser(credential.user);
      } catch (deleteError) {
        console.error("Account cleanup failed:", deleteError);
      }
    }

    registrationInProgress = false;
    authMessage.textContent = authError(error);
  } finally {
    signupBtn.disabled = false;
  }
});

// تسجيل الدخول
loginBtn.addEventListener("click", async () => {
  const username = document
    .getElementById("loginUsername")
    .value.trim()
    .toLowerCase();

  const password = document.getElementById("loginPassword").value;
  console.log("طول كلمة المرور المدخلة:", password.length);
console.log(
  "هل حقل كلمة المرور موجود؟",
  document.getElementById("loginPassword") !== null
);

  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    authMessage.textContent = "اسم المستخدم غير صالح.";
    return;
  }

  if (!password) {
    authMessage.textContent = "أدخل كلمة المرور.";
    return;
  }

  loginBtn.disabled = true;
  authMessage.textContent = "جارٍ تسجيل الدخول...";
  console.log(
  "البريد الذي يتم إرساله إلى Firebase:",
  usernameToEmail(username)
);

  try {
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  } catch (error) {
    authMessage.textContent = authError(error);
  } finally {
    loginBtn.disabled = false;
  }
});

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
  if (registrationInProgress) return;

  if (!user) {
    currentUser = null;
    currentUsername = "";

    stopChatListener();
    stopAssignmentsListener();

    loginForm.hidden = false;
    signupForm.hidden = true;
    logoutBtn.hidden = true;

    showTab("authSection");
    return;
  }

  try {
    const profile = await getDoc(doc(db, "users", user.uid));

    if (!profile.exists()) {
      await signOut(auth);
      authMessage.textContent = "هذا الحساب لا يملك ملف طالب صالحًا.";
      return;
    }

    currentUser = user;
currentUsername = profile.data().username;

startChatListener();
startAssignmentsListener();

    startChatListener();

    loginForm.hidden = true;
    signupForm.hidden = true;
    logoutBtn.hidden = false;

    authMessage.textContent = "مرحبًا " + profile.data().username;

    showTab("home");
  } catch (error) {
    console.error("Authentication check failed:", error);

    currentUser = null;
    await signOut(auth);
    currentUsername = "";
stopAssignmentsListener();

    authMessage.textContent = "تعذر التحقق من الحساب. حاول مجددًا.";
  }
});

// ======================================
// تسجيل الخروج
// ======================================

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    authMessage.textContent = "تم تسجيل الخروج بنجاح.";
  } catch (error) {
    authMessage.textContent = "تعذر تسجيل الخروج.";
    console.error(error);
  }
});

// ======================================
// ربط أزرار التبويبات
// ======================================

document.querySelectorAll("#tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    const tabName = button.dataset.tab;

    if (tabName) {
      showTab(tabName);
    }
  });
});
