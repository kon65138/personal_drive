const form = document.getElementById('uploadForm');
const input = document.getElementById('upload');
const explorer = document.querySelector('.fileList');
const rowTemplate = document.getElementById('fileRowTemplate');
const addFolderBtn = document.getElementById('addFolderBtn');
const newFolderFormCont = document.querySelector('.newFolderContainer');
const newFolderForm = document.getElementById('newFolderForm');
const folderRowTemplate = document.getElementById('folderRowTemplate');
const newFolderInput = document.getElementById('newFolderInput');
const selectedDetails = document.querySelector('.selectedDetails');
const detailsName = selectedDetails.querySelector('.name');
const type = selectedDetails.querySelector('.type');
const detailsSize = selectedDetails.querySelector('.size');
const updated = selectedDetails.querySelector('.updatedAt');
const added = selectedDetails.querySelector('.dateAdded');
const items = selectedDetails.querySelectorAll('.items');
const deleteBtn = document.getElementById('delete');
const renameBtn = document.getElementById('rename');
const storageUsed = document.querySelector('.storageUsed');
const storageLeft = document.querySelector('.storageLeft');
const rootFolder = document.getElementById('rootFolder');
const meterUsed = document.querySelector('.meterUsed');
const meterLeft = document.querySelector('.meterLeft');
const folderInput = document.getElementById('uploadFolder');
const parentIdInput = form.querySelector('input[name="parentId"]');
const progressBar = document.getElementById('progressBar');
const barInside = progressBar.querySelector('.barInside');
const message = progressBar.querySelector('.message');
const errorEl = progressBar.querySelector('.error');
const successEl = progressBar.querySelector('.success');
const failureEl = progressBar.querySelector('.failure');
const stopBtn = document.getElementById('stopUpload');
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// the request in flight, so the stop button has something to abort, and a flag
// so a folder upload stops iterating instead of aborting one file and moving on
let activeXhr = null;
let uploadCancelled = false;

// a clean run only needs a beat before the page catches up; a failure has to
// stay put long enough to actually read
const DONE_DELAY = 1000;
const ERROR_DELAY = 4000;

// every way an upload can end — done, failed, stopped — finishes the same way:
// leave the outcome on screen, then reload so the file list and the storage
// meter reflect whatever actually landed
function finishUpload(text, delay = DONE_DELAY) {
  message.textContent = text;
  setTimeout(() => location.reload(), delay);
}

function addfolderRow(folder) {
  const row = folderRowTemplate.content.firstElementChild.cloneNode(true);

  row.dataset.id = folder.id;

  const link = row.querySelector('.name');
  link.href = `/dashboard/folders/${encodeURIComponent(folder.id)}`;
  link.textContent = folder.name;

  // the form and the + button are also children of .folderList, so appending
  // would drop the row underneath them
  newFolderFormCont.before(row);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  uploadCancelled = false;

  try {
    await runUpload(input.files[0], new FormData(form));
    finishUpload('Upload complete');
  } catch (err) {
    form.reset();
    if (uploadCancelled) return finishUpload('Upload stopped');

    errorEl.textContent = err.message;
    finishUpload('Upload failed', ERROR_DELAY);
  }
});

input.addEventListener('change', () => {
  if (input.files.length) form.requestSubmit();
});

folderInput.addEventListener('change', async () => {
  let success = 0;
  let failure = 0;
  let outOfSpace = false;
  uploadCancelled = false;
  errorEl.textContent = '';
  successEl.textContent = 'Success: 0';
  failureEl.textContent = 'failure: 0';

  for (const file of folderInput.files) {
    const body = new FormData();
    body.append('parentId', parentIdInput.value);
    body.append('relativePath', file.webkitRelativePath);
    body.append('file', file);

    try {
      await runUpload(file, body);
      successEl.textContent = `Success: ${++success}`;
    } catch (err) {
      // a cancel isn't a failure of this file, and the rest of the folder
      // shouldn't keep uploading behind the user's back
      if (uploadCancelled) break;

      errorEl.textContent = `${file.name}: ${err.message}`;
      failureEl.textContent = `failure: ${++failure}`;

      // the volume won't free up mid-run, so every remaining file would fail
      // the same way — stop rather than firing hundreds of doomed requests
      if (err.status === 413) {
        outOfSpace = true;
        break;
      }
    }
  }

  if (uploadCancelled) finishUpload('Upload stopped');
  else if (outOfSpace) finishUpload('Out of storage space', ERROR_DELAY);
  else if (failure) finishUpload('Upload finished with errors', ERROR_DELAY);
  else finishUpload('Upload complete');
});

newFolderForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // URLSearchParams sends application/x-www-form-urlencoded, which
  // express.urlencoded parses — FormData would send multipart, which only
  // multer understands and this route has none
  const response = await fetch(newFolderForm.action, {
    method: 'POST',
    body: new URLSearchParams(new FormData(newFolderForm)),
  });

  if (!response.ok) {
    console.error('Creating folder failed', response.status);
    newFolderForm.reset();
    return;
  }

  newFolderFormCont.style.display = 'none';
  newFolderForm.reset();
  location.reload();
});

addFolderBtn.addEventListener('click', () => {
  if (getComputedStyle(newFolderFormCont).display === 'none') {
    newFolderFormCont.style.display = 'flex';
    newFolderInput.focus();
  } else {
    newFolderForm.requestSubmit();
    newFolderFormCont.style.display = 'none';
  }
});

function clearSelection() {
  document
    .querySelector('.folder.selected, .fileRow.selected')
    ?.classList.remove('selected');
  // an in-flight size request must not repopulate a panel nothing is selected in
  delete selectedDetails.dataset.showing;
}

// clicking away discards whatever was typed rather than creating the folder
function closeNewFolderForm() {
  if (getComputedStyle(newFolderFormCont).display === 'none') return;
  newFolderFormCont.style.display = 'none';
  newFolderForm.reset();
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  closeNewFolderForm();
  clearSelection();
});

document.addEventListener('click', (event) => {
  // the + button runs its own toggle, so closing here would immediately undo it
  if (!event.target.closest('.newFolderContainer, #addFolderBtn')) {
    closeNewFolderForm();
  }

  // controls that act on the current selection must not clear it first
  if (event.target.closest('.selectedDetails')) return;

  const row = event.target.closest('.folder:not(.navUp), .fileRow');

  if (!row) {
    clearSelection();
    return;
  }

  if (row.classList.contains('selected')) return;

  event.preventDefault();
  clearSelection();
  row.classList.add('selected');
  updateDetails(row);
});

async function updateDetails(row) {
  const isFolder = Boolean(row.closest('.folderBar'));
  if (row.id === 'rootFolder') {
    deleteBtn.classList.add('faded');
    renameBtn.classList.add('faded');
  } else {
    deleteBtn.classList.remove('faded');
    renameBtn.classList.remove('faded');
  }

  // stamp what the panel is currently showing, so a size response that arrives
  // after the user has moved on can tell it is stale and bow out
  const token = isFolder
    ? `folder:${row.dataset.id}`
    : `file:${row.dataset.id}`;
  selectedDetails.dataset.showing = token;

  detailsName.textContent = row.children[0].textContent;
  type.textContent = isFolder ? 'Folder' : row.dataset.type;
  updated.textContent = row.dataset.updated;
  added.textContent = isFolder
    ? row.dataset.added
    : row.children[4].textContent;

  items[1].textContent = isFolder ? row.dataset.items : '';
  items[0].style.display = isFolder ? 'block' : 'none';
  items[1].style.display = isFolder ? 'block' : 'none';

  if (!isFolder) {
    detailsSize.textContent = row.children[2].textContent;
    return;
  }

  detailsSize.textContent = '…';

  let size = '--';
  try {
    const response = await fetch(`/dashboard/folders/${row.dataset.id}/size`);
    if (response.ok) ({ size } = await response.json());
  } catch {
    // network failure falls through to '--'
  }

  if (selectedDetails.dataset.showing !== token) return;
  detailsSize.textContent = size;
}

function selectedRow() {
  return document.querySelector('.folder.selected, .fileRow.selected');
}

// the row's pane decides which of the two endpoint pairs applies
function endpointFor(row) {
  const isFolder = Boolean(row.closest('.folderBar'));
  return {
    isFolder,
    url: `/dashboard/${isFolder ? 'folders' : 'files'}/${encodeURIComponent(row.dataset.id)}`,
  };
}

async function failureMessage(response) {
  try {
    const body = await response.json();
    if (body.error) return body.error;
  } catch {
    // non-JSON body — e.g. an expired session redirecting to /login
  }
  return `Request failed (${response.status})`;
}

function resetDetails() {
  detailsName.textContent = '';
  type.textContent = '';
  detailsSize.textContent = '';
  updated.textContent = '';
  added.textContent = '';
  items.forEach((el) => (el.style.display = 'none'));
}

deleteBtn.addEventListener('click', async () => {
  if (deleteBtn.classList.contains('faded')) return;
  const row = selectedRow();
  if (!row) return;

  const { url, isFolder } = endpointFor(row);
  const name = row.querySelector('.name').textContent;

  if (!confirm(`Delete ${isFolder ? 'folder' : 'file'} "${name}"?`)) return;

  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) return alert(await failureMessage(response));

  row.remove();
  clearSelection();
  resetDetails();
  stopBtn.addEventListener('click', async () => {
    if (activeXhr) {
      uploadCancelled = true;
      activeXhr.abort();
      return;
    }

    // nothing in flight, so the button doubles as a dismiss for the failure state

    await pause(1000);
    location.reload();
  });

  updateMeter();
});

// only one row can be in edit mode at a time
let activeRename = null;

renameBtn.addEventListener('click', () => {
  if (renameBtn.classList.contains('faded')) return;

  const row = selectedRow();
  if (!row) return;

  // reopening on another row abandons the first edit
  activeRename?.();

  const { form, input, restore, original } = startRename(row);
  const { url } = endpointFor(row);

  // `settled` stops blur and Escape firing after a submit has taken over
  let settled = false;
  function finish(text) {
    if (settled) return;
    settled = true;
    activeRename = null;
    restore(text);
  }

  activeRename = () => finish(original);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') finish(original);
  });
  input.addEventListener('blur', () => finish(original));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (settled) return;

    const name = input.value.trim();
    if (!name || name === original) return finish(original);

    // claim the edit before awaiting, so a blur mid-request cannot roll it back
    settled = true;

    const response = await fetch(url, {
      method: 'PATCH',
      body: new URLSearchParams({ name }),
    });

    if (!response.ok) {
      alert(await failureMessage(response));
      settled = false;
      return finish(original);
    }

    const { name: saved } = await response.json();
    settled = false;
    finish(saved);
    updateDetails(row);
  });
});

// Swaps the row's .name cell for an input. No action/method: submission is
// intercepted and sent as a PATCH via endpointFor, so the form never navigates.
function startRename(row) {
  const cell = row.querySelector('.name');
  const original = cell.textContent.trim();

  // a .fileRow is itself the download link, so clicking into the input would
  // start a download. an <a> with no href is inert, so stash it for the edit.
  const href = row.getAttribute('href');
  if (href !== null) row.removeAttribute('href');

  const form = document.createElement('form');
  form.className = 'renameForm';
  form.id = `${row.classList.contains('folder') ? 'folder' : 'fileRow'}${row.dataset.id}renameForm`;

  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'name';
  input.required = true;
  input.value = original;
  form.append(input);

  cell.replaceWith(form);
  input.focus();
  input.select();

  // putting the original node back preserves its classes, href and listeners —
  // nothing has to be rebuilt
  function restore(text = original) {
    cell.textContent = text;
    form.replaceWith(cell);
    if (href !== null) row.setAttribute('href', href);
  }

  return { form, input, restore, original };
}

async function updateMeter() {
  let size = '';
  let left = '';
  let percent = '';
  const response = await fetch(
    `/dashboard/folders/${rootFolder.dataset.id}/size`,
  );
  if (response.ok) ({ size } = await response.json());
  const response2 = await fetch(`/dashboard/storageLeft`);
  if (response2.ok) ({ left, percent } = await response2.json());
  storageUsed.textContent = `Storage used: ${size}`;
  storageLeft.textContent = `Storage left: ${left}`;
  meterUsed.style = `width: ${percent}%;`;
  meterLeft.style = `width: ${100 - percent}%`;
}

function uploadFile(body, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/dashboard/newFile');
    activeXhr = xhr;

    const settle = (fn, value) => {
      activeXhr = null;
      fn(value);
    };

    // fires on the request body going out, unlike xhr.onprogress, which
    // tracks the response coming back
    xhr.upload.addEventListener('progress', (event) => {
      // false when the size isn't known up front, which shouldn't happen
      // for a FormData body but is worth guarding
      if (event.lengthComputable) {
        onProgress(event.loaded / event.total);
      }
    });

    xhr.addEventListener('load', () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // a 500 renders HTML, so leave data empty and let status carry it
      }
      if (xhr.status >= 200 && xhr.status < 300) return settle(resolve, data);

      const err = new Error(data.error || `Upload failed (${xhr.status})`);
      err.status = xhr.status;
      settle(reject, err);
    });

    xhr.addEventListener('error', () =>
      settle(reject, new Error('Network error')),
    );
    xhr.addEventListener('abort', () =>
      settle(reject, new Error('Upload cancelled')),
    );

    xhr.send(body);
  });
}

async function runUpload(file, body) {
  progressBar.style.display = 'flex';
  message.textContent = file.name;

  try {
    await uploadFile(body, (fraction) => {
      barInside.style.width = `${Math.round(fraction * 100)}%`;
    });
  } finally {
    barInside.style.width = '0%';
  }
}

stopBtn.addEventListener('click', () => {
  if (!activeXhr) return;

  // the abort rejects the in-flight upload; the handler's catch reads this flag
  // to tell a deliberate stop from a real failure
  uploadCancelled = true;
  activeXhr.abort();
});

updateMeter();

rootFolder.click();
