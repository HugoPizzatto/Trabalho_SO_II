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
    const arrowContainer = document.createElement("div");
    arrowContainer.className = "arrow-container";
    diskContainer.appendChild(arrowContainer);
  
    disk.forEach((block, index) => {
      const blockDiv = document.createElement("div");
      blockDiv.className = "block";
      blockDiv.dataset.index = index; // Salva o índice como atributo
  
      if (block) {
        blockDiv.classList.add("allocated");
        blockDiv.textContent = typeof block === "object" ? block.fileName : block;
      } else {
        blockDiv.textContent = index;
      }
  
      diskContainer.appendChild(blockDiv);
    });
  
    if (allocationType === "linked") {
      drawArrows(arrowContainer);
    }
  }
  
  function drawArrows(container) {
    const blocks = document.querySelectorAll(".block");
    disk.forEach((block, index) => {
      if (block && typeof block === "object" && block.next !== null) {
        const startBlock = blocks[index];
        const endBlock = blocks[block.next];
        const arrow = createArrow(startBlock, endBlock);
        container.appendChild(arrow);
      }
    });
  }
  
  function createArrow(startBlock, endBlock) {
    // Obter retângulo do container pai
    const containerRect = startBlock.parentNode.getBoundingClientRect();
    const startRect = startBlock.getBoundingClientRect();
    const endRect = endBlock.getBoundingClientRect();
  
    // Dimensões dos blocos
    const blockWidth = startRect.width;
    const blockHeight = startRect.height;
  
    // Coordenadas iniciais e finais do centro do bloco
    const startX = startRect.x - containerRect.x + blockWidth / 2;
    const startY = startRect.y - containerRect.y + blockHeight / 2;
    const endX = endRect.x - containerRect.x + blockWidth / 2;
    const endY = endRect.y - containerRect.y + blockHeight / 2;
  
    // Coordenadas ajustadas para a borda do bloco (fora dos limites)
    const startEdgeX = startX + (endX > startX ? blockWidth / 2 : -blockWidth / 2);
    const startEdgeY = startY + (endY > startY ? blockHeight / 2 : -blockHeight / 2);
    const endEdgeX = endX + (endX > startX ? -blockWidth / 2 : blockWidth / 2);
    const endEdgeY = endY + (endY > startY ? -blockHeight / 2 : blockHeight / 2);
  
    // Coordenadas intermediárias para criar caminhos únicos
    let middleX, middleY;
  
    if (startX === endX) {
      // Caso: Vertical
      middleX = startEdgeX;
      middleY = (startEdgeY + endEdgeY) / 2;
    } else if (startY === endY) {
      // Caso: Horizontal
      middleX = (startEdgeX + endEdgeX) / 2;
      middleY = startEdgeY;
    } else {
      // Caso: Diagonal (Organograma)
      middleX = startEdgeX;
      middleY = endEdgeY;
    }
  
    // Criar elemento SVG para o traçado
    const svgNamespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNamespace, "svg");
    const path = document.createElementNS(svgNamespace, "path");
    const marker = document.createElementNS(svgNamespace, "marker");
  
    // Definir o caminho
    const pathData = `
      M ${startEdgeX},${startEdgeY} 
      L ${middleX},${startEdgeY}
      L ${middleX},${middleY}
      L ${endEdgeX},${middleY}
      L ${endEdgeX},${endEdgeY}
    `;
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", "#007BFF");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrowhead)");
  
    // Configurar o marcador (flecha na ponta)
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const arrow = document.createElementNS(svgNamespace, "path");
    arrow.setAttribute("d", "M 0 0 L 10 3.5 L 0 7 Z");
    arrow.setAttribute("fill", "#007BFF");
    marker.appendChild(arrow);
  
    // Adicionar marcador ao SVG
    const defs = document.createElementNS(svgNamespace, "defs");
    defs.appendChild(marker);
    svg.appendChild(defs);
  
    // Configurar SVG
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none"; // Impede interação com o SVG
    svg.appendChild(path);
  
    return svg;
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

    allocatedBlocks.forEach((block) => {
      if (allocationType !== "linked") disk[block] = fileName; // Para encadeado, já está configurado na função
    });
    files[fileName] = { blocks: allocatedBlocks };

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
});
