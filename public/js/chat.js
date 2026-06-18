(function () {
  var toggle = document.getElementById('chatToggle');
  var panel = document.getElementById('chatPanel');
  var close = document.getElementById('chatClose');
  var input = document.getElementById('chatInput');
  var send = document.getElementById('chatSend');
  var messages = document.getElementById('chatMessages');

  if (!toggle || !panel) return;

  toggle.addEventListener('click', function () {
    panel.classList.toggle('open');
    toggle.style.display = 'none';
    if (panel.classList.contains('open')) {
      setTimeout(function () { input && input.focus(); }, 300);
    }
  });

  if (close) {
    close.addEventListener('click', function () {
      panel.classList.remove('open');
      toggle.style.display = 'flex';
    });
  }

  function addMessage(text, isUser) {
    var div = document.createElement('div');
    div.className = 'chat-message ' + (isUser ? 'user' : 'bot');
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'chat-message bot';
    div.id = 'typingIndicator';
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble typing';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    div.appendChild(bubble);
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  async function sendMessage() {
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage(text, true);
    showTyping();

    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      var data = await res.json();
      hideTyping();
      addMessage(data.reply || 'Sorry, I couldn\'t process that.', false);
    } catch (err) {
      hideTyping();
      addMessage('Sorry, something went wrong. Please try again.', false);
    }
  }

  if (send) {
    send.addEventListener('click', sendMessage);
  }

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });
  }
})();
