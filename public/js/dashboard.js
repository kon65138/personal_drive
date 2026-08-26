const form = document.getElementById('uploadForm');
const input = document.getElementById('upload');
const explorer = document.querySelector('.fileExplorer');
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

function addFileRow(file) {
  const row = rowTemplate.content.firstElementChild.cloneNode(true);

  row.href = `/dashboard/files/${encodeURIComponent(file.id)}`;
  row.dataset.id = file.id;
  row.querySelector('.name').textContent = file.name;
  row.querySelector('.size').textContent = file.size;
  row.querySelector('.dateAdded').textContent = file.createdAt;

  document.querySelector('.emptyExplorer')?.remove();
  explorer.append(row);
}

function addfolderRow(folder) {
  const row = folderRowTemplate.content.firstElementChild.cloneNode(true);

  row.dataset.id = folder.id;

  const link = row.querySelector('.name');
  link.href = `/dashboard/folders/${encodeURIComponent(folder.id)}`;
  link.textContent = folder.name;

  // the form and the + button are also children of .folderBar, so appending
  // would drop the row underneath them
  newFolderFormCont.before(row);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const response = await fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
  });

  if (!response.ok) {
    console.error('Upload failed', response.status);
    form.reset();
    return;
  }

  addFileRow(await response.json());
  form.reset();
});

input.addEventListener('change', () => {
  if (input.files.length) form.requestSubmit();
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

  addfolderRow(await response.json());
  newFolderFormCont.style.display = 'none';
  newFolderForm.reset();
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
});

renameBtn.addEventListener('click', async () => {
  const row = selectedRow();
  if (!row) return;

  const nameCell = row.querySelector('.name');
  const current = nameCell.textContent;
  const name = window.prompt('New name', current)?.trim();
  if (!name || name === current) return;

  const { url } = endpointFor(row);
  const response = await fetch(url, {
    method: 'PATCH',
    body: new URLSearchParams({ name }),
  });
  if (!response.ok) return alert(await failureMessage(response));

  const { name: saved } = await response.json();
  nameCell.textContent = saved;
  updateDetails(row);
});

document.getElementById('rootFolder').click();
