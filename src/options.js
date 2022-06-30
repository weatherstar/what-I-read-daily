import "bootstrap/dist/css/bootstrap.css";

import { GITHUB_CONFIGS } from "./constants";

let githubConfigsForm = null;
let githubConfigInputs = null;

document.addEventListener("DOMContentLoaded", function () {
  init();
});

function init() {
  initElements();
  bindEvents();
  getConfigs();
}

function initElements() {
  githubConfigsForm = document.querySelector("#github-configs");
  githubConfigInputs =Array.from(githubConfigsForm.querySelectorAll('input[name]'));
}

function bindEvents() {
  githubConfigsForm.addEventListener("submit", handleGithubConfigFormOnSubmit);
}

function getConfigs() {
  chrome.storage.local.get('githubConfigs', function (result) {
    if(result.githubConfigs){
      githubConfigInputs.forEach(
        (input) => {
          input.value = result.githubConfigs[input.name] || "";
        }
      );
    }
  });
}

function handleGithubConfigFormOnSubmit(e) {
  e.preventDefault();
  let githubConfigs = {};
  githubConfigInputs.forEach(
    (input) => {
      githubConfigs[input.name] = input.value;
    }
  );
  chrome.storage.local.set({githubConfigs});
}
