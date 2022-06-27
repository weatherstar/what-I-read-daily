"use strict";

import { Octokit } from "@octokit/core";

import { COMMAND_TYPE } from "./constants";
import { sendCommandMessageToContent } from "./utils/message";
import { getFormattedToday } from "./utils/time";

const githubConfig = {
  username: "weatherstar",
  authKey: "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",
  file: "WHAT_I_READ_DAILY.md",
};

const githubContentAPIBaseConfig = {
  owner: githubConfig.username,
  repo: githubConfig.username,
  path: githubConfig.file,
};

const octokit = new Octokit({ auth: githubConfig.authKey });

async function fetchTargetFileContent() {
  try {
    const resp = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      githubContentAPIBaseConfig
    );
    return [self.atob(resp.data.content), resp.data.sha];
  } catch (e) {
    return [null];
  }
}

async function handleAddToListOnClick(_, tab) {
  const { title, url } = tab;
  const listItem = `<a href=${url} target="_blank">${title}</a>`;
  const [content, sha] = await buildFileContent(listItem, tab);
  updateDailyReadingList(content.trim(), sha);
}

async function buildFileContent(listItem, tab) {
  const [content, sha] = await fetchTargetFileContent(githubConfig.file);
  if (content !== null) {
    const resp = await sendCommandMessageToContent(
      {
        content,
        listItem,
      },
      COMMAND_TYPE.BUILD_READING_LIST,
      tab
    );

    return [resp.content, sha];
  } else {
    const today = getFormattedToday();
    return [
      `<h1>What I read daily</h1>
            <section id="reading-list-${today}">
              <h4>${today}</h4>
              <ul>
                <li><samp>${listItem}</samp></li>
              </ul>
            </section>`,
    ];
  }
}

async function updateDailyReadingList(content, sha) {
  try {
    octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      ...githubContentAPIBaseConfig,
      message: "update reading list",
      content: self.btoa(content),
      sha
    });
  } catch (e) {
    console.log(e);
  }
}

// Create context menu
chrome.contextMenus.create({
  id: "whatIReadDaily",
  title: "What I read daily",
  contexts: ["all"],
});
// Create context submenu
chrome.contextMenus.create({
  id: "addToList",
  parentId: "whatIReadDaily",
  title: "添加到今日阅读",
  contexts: ["all"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const { menuItemId } = info;
  if (menuItemId === "addToList") {
    handleAddToListOnClick(info, tab);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GREETINGS") {
    const message = `Hi ${
      sender.tab ? "Con" : "Pop"
    }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
  }
});
