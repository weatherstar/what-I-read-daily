"use strict";

import { Octokit } from "@octokit/core";
import { encode, decode } from "js-base64";

import { COMMAND_TYPE, DEFAULT_TARGET_FILE_NAME } from "./constants";
import {
  sendCommandMessageToContent,
  sendErrorMessageToContent,
  sendSuccessMessageToContent,
  sendInfoMessageToContent,
} from "./utils/message";
import { getFormattedToday } from "./utils/time";

let githubConfigs = {};
let octokit = null;

init();

function init() {
  getConfigs();
  bindEvents();
  createContextMenu();
}

function getConfigs() {
  chrome.storage.local.get("githubConfigs", (result) => {
    githubConfigs = result.githubConfigs || {};
    createOctokit();
  });
}

function getGithubContentAPIBaseConfigs() {
  return {
    owner: githubConfigs.username,
    repo: githubConfigs.username,
    path: `${githubConfigs.targetFileName || DEFAULT_TARGET_FILE_NAME}.md`,
  };
}

function bindEvents() {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const { menuItemId } = info;
    if (menuItemId === "addToList") {
      handleAddToListOnClick(info, tab);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.githubConfigs && changes.githubConfigs.newValue) {
      if (
        changes.githubConfigs.newValue.personalAccessToken !==
        githubConfigs.personalAccessToken
      ) {
        createOctokit();
      }
      githubConfigs = { ...githubConfigs, ...changes.githubConfigs.newValue };
    }
  });

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
      chrome.runtime.openOptionsPage();
    }
  });
}

function createContextMenu() {
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
}

function createOctokit() {
  if (githubConfigs && githubConfigs.personalAccessToken) {
    octokit = new Octokit({ auth: githubConfigs.personalAccessToken });
  }
}

async function fetchTargetFileContent() {
  try {
    const resp = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      getGithubContentAPIBaseConfigs()
    );
    return [decode(resp.data.content), resp.data.sha];
  } catch (e) {
    return [null];
  }
}

async function handleAddToListOnClick(_, tab) {
  if (!checkConfigs()) {
    sendErrorMessageToContent(
      {
        message: "请完善 Github 配置，否则无法使用",
      },
      tab
    );
    return;
  }

  const pageInfo = await sendCommandMessageToContent(
    {},
    COMMAND_TYPE.GET_PAGE_INFO
  );
  let listItem = `<samp><a href=${pageInfo.url || tab.url} target="_blank">${
    pageInfo.h1 || pageInfo.title || tab.title
  }</a></samp>`;

  if (pageInfo.description) {
    listItem = `<details>
    <summary>${listItem}</summary>
    <samp><p>${pageInfo.description}</p><samp>
  </details>`;
  }

  const [content, sha] = await buildFileContent(listItem, tab);
  const { messageId } = await sendInfoMessageToContent(
    { message: "保存中", persistent: true },
    tab
  );
  try {
    await updateDailyReadingList(content.trim(), sha);
    sendSuccessMessageToContent(
      {
        message: "Successfully added to daily reading list.",
      },
      tab
    );
  } catch (e) {
    sendErrorMessageToContent(
      {
        message: e.response.data.message,
      },
      tab
    );
  }

  sendCommandMessageToContent({ messageId }, COMMAND_TYPE.HIDE_MESSAGE, tab);
}

function checkConfigs() {
  if (!githubConfigs.username) return false;
  if (!githubConfigs.personalAccessToken) return false;
  if (!octokit) return false;
  return true;
}

async function buildFileContent(listItem, tab) {
  const [content, sha] = await fetchTargetFileContent();
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
  return octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    ...getGithubContentAPIBaseConfigs(),
    message: "update reading list",
    content: encode(content),
    sha,
  });
}
