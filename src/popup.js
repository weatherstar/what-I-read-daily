'use strict';

import "bootstrap/dist/css/bootstrap.css";
import "./styles/popup.css";

import { COMMAND_TYPE } from './constants'
import { buildReadingList } from './utils/common'
import { sendCommandMessageToContent,sendCommandMessageToBackground } from './utils/message'

let submitting = false;

let addToListBtn;
let pageInfoForm;

function init() {
  addToListBtn = document.querySelector('#add-to-list');
  pageInfoForm = document.querySelector('#page-info-form');
  bindEvents()
  fetchPageInfo();  
}

function bindEvents() {
  pageInfoForm.addEventListener('submit', handlePageInfoOnSubmit);
}

async function fetchPageInfo() {
  const pageInfo = await sendCommandMessageToContent(
    {},
    COMMAND_TYPE.GET_PAGE_INFO
  );

  document.querySelector('#title').value = pageInfo.h1 || pageInfo.title;
  document.querySelector('#description').textContent = pageInfo.description;
}


async function handlePageInfoOnSubmit(e) {
  e.preventDefault();

  if(submitting) return;

  let formData = {};
  for(let item of new FormData(e.target).entries()){
    formData[item[0]] = (item[1] || '').trim();
  }

  submitting = true;

  try{
    await sendCommandMessageToBackground({
      command: COMMAND_TYPE.GET_READING_LIST,
      padyload: formData
    })
  }catch(e) {
    console.log(e)
  }

  submitting = false;
}


document.addEventListener('DOMContentLoaded', init);
