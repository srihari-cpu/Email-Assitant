console.log("Email Writer Extension - Content Script Loaded");

//creating button
function createAIButton() {
  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3";
  button.style.marginRight = "8px";
  button.innerHTML = "AI Reply";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generated AI Reply");
  return button;
}

//accessing the sender content
function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    ".gmail_quote",
    '[role="presentation"]',
  ];
  for (const select of selectors) {
    const content = document.querySelector(select);
    if (content) {
      return content.innerText.trim();
    }
    return "";
  }
}

//finding wherer to insert
function findComposeToolBar() {
  const selectors = [".btC", ".IZ", ".aDh", '[role:"toolbar"]', ".gU.Up"];

  for (const select of selectors) {
    const toolbar = document.querySelector(select);
    if (toolbar) {
      return toolbar;
    }
    return null;
  }
}

//adding button
function injectButton() {
  console.log("injecting button......");
  const existingButton = document.querySelector(".ai-reply-button");
  if (existingButton) {
    existingButton.remove();
  }
  const toolbar = findComposeToolBar();
  if (!toolbar) {
    console.log("tool bar is not found");
    return;
  }
  console.log("tool bar found");
  const button = createAIButton();
  button.classList.add("ai-reply-button");

  button.addEventListener("click", async () => {
    try {
      button.innerHTML = "Generating...";
      button.disabled = true;

      const emailContent = getEmailContent();

      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailContent, tone: "professional" }),
      });

      if (!response.ok) {
        throw new Error("API Requested Failed");
      }

      const generatedReply = await response.text();

      const composeBox = document.querySelector(
        '[role="textbox"][g_editable="true"]'
      );

      if (composeBox) {
        composeBox.focus();
        document.execCommand("insertText", false, generatedReply);
      } else {
        console.error("compose box was not found");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate Reply");
    } finally {
      button.innerHTML = "AI Reply";
      button.disabled = false;
    }
  });

  toolbar.insertBefore(button, toolbar.firstChild);
}

//creating mutation observer
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh,.IZ,.btC,[role="dialog"]') ||
          node.querySelector('.aDh,.IZ,.btC,[role="dialog"]'))
    );
    if (hasComposeElements) {
      console.log("Compose window was detected");
      setTimeout(injectButton, 500);
    }
  }
});

//observeing the changes in the dom
observer.observe(document.body, {
  childList: true,
  subtree: true,
});
