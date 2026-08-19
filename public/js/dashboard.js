const form = document.getElementById('uploadForm');
const input = document.getElementById('upload');
const explorer = document.querySelector('.fileExplorer');
const rowTemplate = document.getElementById('fileRowTemplate');
const addFolderBtn = document.getElementById('addFolderBtn');
const newFolderFormCont = document.querySelector('.newFolderContainer');
const newFolderForm = document.getElementById('newFolderForm');
const folderRowTemplate = document.getElementById('folderRowTemplate');
const folderBar = document.querySelector('.folderBar');

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

  row.href = `/dashboard/folders/${encodeURIComponent(folder.id)}`;
  row.dataset.id = folder.id;
  row.querySelector('.name').textContent = folder.name;

  folderBar.append(row);
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

  const response = await fetch(newFolderForm.action, {
    method: 'POST',
    body: new FormData(newFolderForm),
  });

  if (!response.ok) {
    console.error('Upload failed', response.status);
    newFolderForm.reset();
    return;
  }

  addfolderRow(await response.json());
  newFolderForm.reset();
});

addFolderBtn.addEventListener('click', () => {
  if (getComputedStyle(newFolderFormCont).display === 'none') {
    newFolderFormCont.style.display = 'flex';
  } else {
    newFolderForm.requestSubmit();
    newFolderFormCont.style.display = 'none';
  }
});
