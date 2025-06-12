document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('user-input');
  const output = document.getElementById('chat-output');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prompt = input.value.trim();
    if (!prompt) return;

    // Show user prompt in chat
    output.innerHTML += `<div class="user-msg">🧠 You: ${prompt}</div>`;
    input.value = '';

    // Show loading message
    output.innerHTML += `
      <div class="bot-msg loading">
        <img src="mascot.png" alt="RIOgpt Mascot" class="mascot-img" onerror="this.style.display='none'; this.nextElementSibling.innerHTML=' ' + this.nextElementSibling.innerHTML;">
        <div class="message-content">RIOgpt is thinking...</div>
      </div>`;
    output.scrollTop = output.scrollHeight;

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      // Remove loading message
      const loadingMsg = output.querySelector('.loading');
      if (loadingMsg) loadingMsg.remove();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        output.innerHTML += `<div class="bot-msg error">❌ Error: ${data.error}</div>`;
      } else {
        output.innerHTML += `
          <div class="bot-msg">
            <img src="mascot.png" alt="RIOgpt Mascot" class="mascot-img" onerror="this.style.display='none'; this.nextElementSibling.innerHTML='🤖 ' + this.nextElementSibling.innerHTML;">
            <div class="message-content">RIOgpt: ${data.response}</div>
          </div>`;
      }
    } catch (err) {
      // Remove loading message if still there
      const loadingMsg = output.querySelector('.loading');
      if (loadingMsg) loadingMsg.remove();
      
      output.innerHTML += `
        <div class="bot-msg error">
          <img src="mascot.png" alt="RIOgpt Mascot" class="mascot-img" onerror="this.style.display='none'; this.nextElementSibling.innerHTML='❌ ' + this.nextElementSibling.innerHTML;">
          <div class="message-content">Error getting response: ${err.message}</div>
        </div>`;
      console.error('Chat error:', err);
    }

    // Auto-scroll
    output.scrollTop = output.scrollHeight;
  });
});