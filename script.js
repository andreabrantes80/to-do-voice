(function () {
  emailjs.init("RrGeb9jYdXaljYYhO"); // Substitua "user_123456" pelo seu userID do EmailJS
})();

// Referências aos elementos HTML
const startButton = document.getElementById("startButton");
const outputDiv = document.getElementById("output");
const todoList = document.getElementById("todoList");
const alarmInput = document.getElementById("alarmInput");
const alarmSound = document.getElementById("alarmSound");
const emailInput = document.getElementById("emailInput");
const saveEmailButton = document.getElementById("saveEmailButton");
const clearEmailButton = document.getElementById("clearEmailButton");

// Array para armazenar as tarefas
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let alarmTimeout = null;
let isAlarmActive = false;
let userEmail = "";


// Carregar o e-mail do localStorage apenas para preencher o campo (mas não usá-lo diretamente)
const savedEmail = localStorage.getItem("userEmail") || "";
if (savedEmail) {
  emailInput.value = savedEmail; // Preenche o campo com o e-mail salvo, mas não o usa até que o usuário clique em "Salvar E-mail"
}

// Salvar o e-mail no localStorage
saveEmailButton.addEventListener("click", () => {
  const email = emailInput.value.trim();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    localStorage.setItem("userEmail", email);
    userEmail = email;
    alert("E-mail salvo com sucesso!");
  } else {
    alert("Por favor, insira um e-mail válido (ex.: seuemail@exemplo.com).");
  }
});

// Limpar o e-mail salvo (opcional, se você adicionar o botão no HTML)
if (clearEmailButton) {
  clearEmailButton.addEventListener("click", () => {
    localStorage.removeItem("userEmail"); // Remove o e-mail do localStorage
    userEmail = ""; // Limpa a variável userEmail
    emailInput.value = ""; // Limpa o campo de input
    alert("E-mail removido com sucesso!");
  });
}

// Renderizar as tarefas ao carregar a página
renderTasks();

// Inicializar o reconhecimento de voz
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
  alert(
    "Desculpe, seu navegador não suporta a API de reconhecimento de voz. Tente usar o Chrome."
  );
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  startButton.addEventListener("click", () => {
    recognition.start();
    startButton.textContent = "🎙️ Escutando...";
    outputDiv.textContent = "Fale sua tarefa...";
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    outputDiv.textContent = transcript;
    const alarmDateTime = alarmInput.value; // Pega a data e hora do input
    addTask(transcript, alarmDateTime);
    startButton.textContent = "🎙️ Falar Tarefa";
    alarmInput.value = ""; // Limpa o campo de data/hora
  };

  recognition.onend = () => {
    startButton.textContent = "🎙️ Falar Tarefa";
  };

  recognition.onerror = (event) => {
    outputDiv.textContent = "Erro no reconhecimento: " + event.error;
    startButton.textContent = "🎙️ Falar Tarefa";
  };
}

// Função para adicionar uma tarefa à lista
function addTask(taskText, alarmDateTime) {
  if (taskText.trim() === "") return;

  const task = {
    id: Date.now(),
    text: taskText,
    completed: false,
    alarm: alarmDateTime ? new Date(alarmDateTime).toISOString() : null, // Armazena a data/hora como ISO string
  };

  tasks.push(task);
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

// Função para renderizar a lista de tarefas
function renderTasks() {
  todoList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = task.completed ? "completed" : "";

    // Contêiner para informações da tarefa
    const taskInfo = document.createElement("div");
    taskInfo.className = "task-info";

    // Checkbox para marcar como concluída
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTasks();
    });

    // Texto da tarefa
    const taskText = document.createElement("span");
    taskText.textContent = task.text;

    // Data e hora do alarme (se existir)
    const alarmTime = document.createElement("span");
    alarmTime.className = "alarm-time";
    alarmTime.textContent = task.alarm
      ? new Date(task.alarm).toLocaleString("pt-BR")
      : "Sem alarme";

    taskInfo.appendChild(checkbox);
    taskInfo.appendChild(taskText);
    taskInfo.appendChild(alarmTime);

    // Contêiner para ações (botões)
    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";

    // Botão para excluir
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTasks();
    });

    taskActions.appendChild(deleteButton);

    li.appendChild(taskInfo);
    li.appendChild(taskActions);
    todoList.appendChild(li);
  });
}

// Função para parar o som do alarme
function stopAlarmSound() {
  if (alarmSound) {
    alarmSound.pause();
    alarmSound.currentTime = 0; // Reseta o áudio para o início
  }
  if (alarmTimeout) {
    clearTimeout(alarmTimeout);
    alarmTimeout = null;
  }
  isAlarmActive = false;
}

// Função para verificar alarmes
function checkAlarms() {
  const now = new Date();

  tasks.forEach((task) => {
    if (task.alarm && !task.completed) {
      const alarmDate = new Date(task.alarm);
      if (now >= alarmDate) {
        // Dispara o alarme
        triggerAlarm(task);
        // Desativa o alarme para não disparar novamente
        task.alarm = null;
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
      }
    }
  });
}

// Função para disparar o alarme
function triggerAlarm(task) {
  // Para qualquer alarme anterior
  if (isAlarmActive) {
    stopAlarmSound();
  }

  isAlarmActive = true;

  // Toca o som do alarme (se disponível)
  let soundPlayed = false;
  if (alarmSound) {
    try {
      alarmSound
        .play()
        .then(() => {
          soundPlayed = true;
        })
        .catch((err) => {
          console.log("Erro ao tocar o som:", err);
        });
    } catch (err) {
      console.log("Erro ao tentar tocar o som:", err);
    }
  }

  // Exibe uma notificação (se o navegador suportar)
  if (Notification.permission === "granted") {
    new Notification("Lembrete de Tarefa", {
      body: `A tarefa "${task.text}" está na hora!`,
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("Lembrete de Tarefa", {
          body: `A tarefa "${task.text}" está na hora!`,
        });
      }
    });
  }

  if (userEmail) {
    const templateParams = {
      to_email: userEmail,
      task_text: task.text,
      alarm_date: task.alarm
        ? new Date(task.alarm).toLocaleString("pt-BR")
        : "Sem data definida",
    };
    console.log("Enviando e-mail para:", userEmail); // Log para depuração
    emailjs.send("service_vwpxkul", "template_zk93qhf", templateParams).then(
      () => {
        console.log("E-mail enviado com sucesso!");
      },
      (error) => {
        console.log("Erro ao enviar o e-mail:", error);
        alert(
          "Erro ao enviar o e-mail. Verifique o console para mais detalhes."
        );
      }
    );
  } else {
    console.log(
      "E-mail do usuário não configurado. Não foi possível enviar o e-mail."
    );
    alert("Por favor, salve um e-mail antes de enviar notificações.");
  }

  // Para o som após 15 segundos
  alarmTimeout = setTimeout(() => {
    stopAlarmSound();
  }, 15000); // 15 segundos
}

// Verifica os alarmes a cada 10 segundos
setInterval(checkAlarms, 10000);

// Solicita permissão para notificações ao carregar a página
if (
  Notification &&
  Notification.permission !== "granted" &&
  Notification.permission !== "denied"
) {
  Notification.requestPermission();
}
