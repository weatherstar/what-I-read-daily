import { MESSAGE_TYPE } from "../constants";

export function sendCommandMessageToContent(data, command, tab) {
  return sendMessageToContent(
    {
      type: MESSAGE_TYPE.COMMAND,
      command: command,
      payload: {
        ...data,
      },
    },
    tab
  );
}

export function sendErrorMessageToContent(error, tab) {
  return sendMessageToContent(
    {
      type: MESSAGE_TYPE.ERROR,
      payload: {
        ...error,
      },
    },
    tab
  );
}

export function sendSuccessMessageToContent(message, tab) {
  return sendMessageToContent(
    {
      type: MESSAGE_TYPE.SUCCESS,
      payload: {
        ...message,
      },
    },
    tab
  );
}

export function sendMessageToContent(message, tab) {
  return new Promise((resolve) => {
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, message, null, (response) => {
        resolve(response);
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, null, (response) => {
            resolve(response)
        });
      });
    }
  });
}
