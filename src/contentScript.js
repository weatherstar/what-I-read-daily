"use strict";

import { MESSAGE_TYPE, COMMAND_TYPE } from "./constants";
import { getFormattedToday } from "./utils/time";
let messageIndex = 0;

const MESSAGE_BOX_ID = "what-i-read-daily-message-box";

function buildReadingList(content, listItem) {
  const today = getFormattedToday();

  try {
    const contentWrapper = document.createElement("div");
    contentWrapper.innerHTML = content;
    const title = contentWrapper.querySelector("h1");
    const section = contentWrapper.querySelector(`#reading-list-${today}`);

    if (!title) {
      const title = document.createElement("h1");
      title.innerText = "What I read daily";
      contentWrapper.prepend(title);
    }

    if (section) {
      const list = section.querySelector("ul");
      const listItemWrapper = document.createElement("div");
      listItemWrapper.innerHTML = `<li><samp>${listItem}</samp></li>`;
      list.prepend(listItemWrapper.firstElementChild);
    } else {
      const section = document.createElement("section");
      section.id = `reading-list-${today}`;
      const sectionTitle = document.createElement("h4");
      sectionTitle.innerText = today;
      const list = document.createElement("ul");
      const listItemWrapper = document.createElement("div");
      listItemWrapper.innerHTML = `<li><samp>${listItem}</samp></li>`;
      list.append(listItemWrapper.firstElementChild);
      section.append(sectionTitle);
      section.append(list);
      contentWrapper.insertBefore(
        section,
        contentWrapper.querySelector("h1").nextSibling
      );
    }

    return contentWrapper.innerHTML;
  } catch (e) {
    return file;
  }
}

function handleInfoMessage(payload) {
  const { message, persistent } = payload;
  return showMessage(MESSAGE_TYPE.INFO, message, persistent);
}

function handleSuccessMessage(payload) {
  const { message, persistent } = payload;
  return showMessage(MESSAGE_TYPE.SUCCESS, message, persistent);
}

function handleErrorMessage(payload) {
  const { message, persistent } = payload;
  return showMessage(MESSAGE_TYPE.ERROR, message, persistent);
}

function handleHideMessage(messageId) {
  if (messageId) {
    const message = document.querySelector(`#${messageId}`);
    if (message) {
      hideMessage(message);
    }
  } else {
    const messageBox = document.querySelector(`#${MESSAGE_BOX_ID}`);
    messageBox.remove();
  }
}

function hideMessage(message) {
  message.style.opacity = 0;
  setTimeout(() => {
    message.remove();
    message = null;
  }, 300);
}

function getMessageStyleBasedOnType(type) {
  switch (type) {
    case MESSAGE_TYPE.ERROR:
      return {
        color: "#842029",
        backgroundColor: "#f8d7da",
        borderColor: "#f5c2c7",
      };
    case MESSAGE_TYPE.SUCCESS:
      return {
        color: "#0f5132",
        backgroundColor: "#d1e7dd",
        borderColor: "#badbcc",
      };
    default:
      return {
        color: "#084298",
        backgroundColor: "#cfe2ff",
        borderColor: "#b6d4fe",
      };
  }
}

function showMessage(type, message, persistent) {
  let messageBox = document.querySelector(`#${MESSAGE_BOX_ID}`);
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.style.with = "200px";
    messageBox.style.position = "fixed";
    messageBox.style.bottom = "20px";
    messageBox.style.right = "20px";
    messageBox.style.zIndex = "999999";
    messageBox.id = MESSAGE_BOX_ID;
    document.body.append(messageBox);
  }

  messageIndex++;

  let messageItem = document.createElement("div");
  messageItem.style.border = "1px soild #ddd";
  messageItem.style.borderRadius = "4px";
  messageItem.style.padding = "10px";
  messageItem.style.marginTop = "10px";
  messageItem.style.opacity = 0;
  messageItem.style.transition = "all .3s ease";
  messageItem.innerText = message;
  messageItem.id = `what-i-read-daily-message-${messageIndex}`;
  const { color, borderColor, backgroundColor } =
    getMessageStyleBasedOnType(type);

  messageItem.style.color = color;
  messageItem.style.borderColor = borderColor;
  messageItem.style.backgroundColor = backgroundColor;

  messageBox.append(messageItem);
  window.requestAnimationFrame(() => {
    messageItem.style.opacity = 1;
  });
  if (persistent) {
    return messageItem.id;
  } else {
    setTimeout(() => {
      hideMessage(messageItem);
    }, 3000);
  }
}

// Listen for message
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  switch (request.type) {
    case MESSAGE_TYPE.COMMAND:
      switch (request.command) {
        case COMMAND_TYPE.BUILD_READING_LIST:
          const { content, listItem } = request.payload;
          sendResponse({ content: buildReadingList(content, listItem) });
          break;
        case COMMAND_TYPE.HIDE_MESSAGE:
          const { messageId } = request.payload;
          handleHideMessage(messageId);
          sendResponse({ messageId });
          break;
        default:
          sendResponse({});
      }
      break;
    case MESSAGE_TYPE.SUCCESS:
      sendResponse({ messageId: handleSuccessMessage(request.payload) });
      break;
    case MESSAGE_TYPE.ERROR:
      sendResponse({ messageId: handleErrorMessage(request.payload) });
      break;
    case MESSAGE_TYPE.INFO:
      sendResponse({ messageId: handleInfoMessage(request.payload) });
    default:
      sendResponse({});
  }
  return true;
});
