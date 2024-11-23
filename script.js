document.addEventListener("DOMContentLoaded", () => {
  const configForm = document.getElementById("config-form");
  const diskContainer = document.getElementById("disk-container");
  const allocationTable = document.getElementById("allocation-table").querySelector("tbody");
  const addFileBtn = document.getElementById("add-file-btn");
  const removeFileBtn = document.getElementById("remove-file-btn");

  let diskSize = 0;
  let allocationType = "contiguous";
  let disk = [];
  let files = {};

  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    diskSize = parseInt(document.getElementById("disk-size").value);
    allocationType = document.getElementById("allocation-type").value;
    initializeDisk();
  });

  addFileBtn.addEventListener("click", () => {
    const fileName = document.getElementById("file-name").value.trim();
    const fileSize = parseInt(document.getElementById("file-size").value);
    if (!fileName || isNaN(fileSize) || fileSize <= 0) {
      alert("Nome do arquivo inválido ou tamanho inválido!");
      return;
    }
    addFile(fileName, fileSize);
  });

  removeFileBtn.addEventListener("click", () => {
    const fileName = document.getElementById("file-name").value.trim();
    if (!fileName) {
      alert("Digite o nome do arquivo para removê-lo!");
      return;
    }
    removeFile(fileName);
  });

  function initializeDisk() {
    disk = Array(diskSize).fill(null);
    files = {};
    renderDisk();
    renderTable();
  }

  function renderDisk() {
    diskContainer.innerHTML = "";
  
    disk.forEach((block, index) => {
      const blockDiv = document.createElement("div");
      blockDiv.className = "block";
      blockDiv.dataset.index = index;
  
      if (block) {
        blockDiv.classList.add("allocated");
        if (typeof block === "object") {
          blockDiv.textContent = block.fileName;
          blockDiv.style.backgroundColor = files[block.fileName].color;
        } else {
          blockDiv.textContent = block;
          blockDiv.style.backgroundColor = files[block].color;
        }
      } else {
        blockDiv.textContent = index;
      }
  
      diskContainer.appendChild(blockDiv);
    });
  }

  function renderTable() {
    allocationTable.innerHTML = "";

    for (const [fileName, data] of Object.entries(files)) {
        let blockList = "";

        if (allocationType === "linked") {
            blockList = data.blocks
                .map((b) => `${b} ${disk[b].next !== null ? "→" : ""}`)
                .join(" ");
        } else if (allocationType === "indexed") {
            blockList = `Índice: ${data.blocks[0]} | Dados: ${data.blocks.slice(1).join(", ")}`;
        } else {
            blockList = data.blocks.join(", ");
        }

        const row = document.createElement("tr");
        row.innerHTML = `<td>${fileName}</td><td>${blockList}</td>`;
        allocationTable.appendChild(row);
    }
  }

  function addFile(fileName, fileSize) {
    if (files[fileName]) return alert("Arquivo já existe!");
    const freeBlocks = disk.map((block, index) => (block === null ? index : null)).filter((i) => i !== null);
  
    if (fileSize > freeBlocks.length) return alert("Espaço insuficiente!");
  
    let allocatedBlocks;
  
    switch (allocationType) {
      case "contiguous":
        allocatedBlocks = allocateContiguously(freeBlocks, fileSize);
        break;
      case "linked":
        allocatedBlocks = allocateLinked(freeBlocks, fileSize, fileName);
        break;
      case "indexed":
        allocatedBlocks = allocateIndexed(freeBlocks, fileSize);
        break;
      default:
        alert("Tipo de alocação inválido!");
        return;
    }
  
    if (!allocatedBlocks) return alert("Não foi possível alocar o arquivo!");
  
    const fileColor = generateRandomColor();
  
    allocatedBlocks.forEach((block) => {
      if (allocationType !== "linked") {
        disk[block] = fileName;
      }
    });
  
    files[fileName] = { blocks: allocatedBlocks, color: fileColor };
  
    renderDisk();
    renderTable();
  }

  function removeFile(fileName) {
    if (!files[fileName]) return alert("Arquivo não encontrado!");

    files[fileName].blocks.forEach((block) => (disk[block] = null));
    delete files[fileName];

    renderDisk();
    renderTable();
  }

  function allocateContiguously(freeBlocks, fileSize) {
    for (let i = 0; i <= freeBlocks.length - fileSize; i++) {
      const slice = freeBlocks.slice(i, i + fileSize);
      if (slice.length === fileSize && slice[slice.length - 1] - slice[0] === fileSize - 1) {
        return slice;
      }
    }
    return null;
  }

  function allocateLinked(freeBlocks, fileSize, fileName) {
    if (freeBlocks.length < fileSize) return null;

    const allocatedBlocks = shuffleArray(freeBlocks).slice(0, fileSize);

    for (let i = 0; i < allocatedBlocks.length - 1; i++) {
      const currentBlock = allocatedBlocks[i];
      const nextBlock = allocatedBlocks[i + 1];
      disk[currentBlock] = { fileName, next: nextBlock };
    }

    const lastBlock = allocatedBlocks[allocatedBlocks.length - 1];
    disk[lastBlock] = { fileName, next: null };

    return allocatedBlocks;
  }

  function allocateIndexed(freeBlocks, fileSize) {
    if (freeBlocks.length < fileSize + 1) return null;

    const shuffledBlocks = shuffleArray(freeBlocks);
    const indexBlock = shuffledBlocks[0];
    const dataBlocks = shuffledBlocks.slice(1, fileSize + 1);

    disk[indexBlock] = { index: dataBlocks };
    return [indexBlock, ...dataBlocks];
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function generateRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
});
