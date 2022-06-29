import "bootstrap/dist/css/bootstrap.css";

import { GITHUB_CONFIGS } from "./constants";

let githubConfigsForm = null;

function handleGithubConfigFormOnSubmit(e) {
  e.preventDefault();
  let githubConfigs = {};
  Array.from(githubConfigsForm.querySelectorAll("input[name]")).forEach(
    (input) => {
      githubConfigs[input.name] = input.value;
    }
  );
  chrome.storage.local.set(githubConfigs);
}

function bindEvents() {
  githubConfigsForm.addEventListener("submit", handleGithubConfigFormOnSubmit);
}

function initElements() {
  githubConfigsForm = document.querySelector("#github-configs");
}

function init() {
  initElements();
  bindEvents();
  setGithubConfigs();
}

function setGithubConfigs() {
  chrome.storage.local.get(Object.values(GITHUB_CONFIGS), function (result) {
    Array.from(githubConfigsForm.querySelectorAll("input[name]")).forEach(
      (input) => {
        input.value = result[input.name] || "";
      }
    );
  });
}

document.addEventListener("DOMContentLoaded", function () {
  init();
});
