"use strict";

import { MESSAGE_TYPE, COMMAND_TYPE } from "./constants";
import { getFormattedToday } from "./utils/time";

function buildReadingList(content, listItem) {
  const today = getFormattedToday();

  try {
    const contentWrapper = document.createElement("div");
    contentWrapper.innerHTML = content;
    const title = contentWrapper.querySelector('h1');
    const section = contentWrapper.querySelector(`#reading-list-${today}`);

    if(!title){
      const title = document.createElement('h1');
      title.innerText = 'What I read daily';
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
      contentWrapper.insertBefore(section, contentWrapper.querySelector('h1').nextSibling);
    }

    return contentWrapper.innerHTML;
  } catch (e) {
    return file;
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
        default:
          sendResponse({});
      }
      break;
    default:
      sendResponse({});
  }
  return true;
});
