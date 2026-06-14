const { createApp, reactive, computed, ref, onMounted, toRefs } = Vue;

createApp({
  setup() {
    const currentType = ref('Wall');
    const newCols = ref(12);
    const newRows = ref(6);
    const state = reactive({
      cols: 12,
      rows: 6,
      levelNum: 1,
      grid: [],
      mouseDown: false,
      hoverCell: null,
      history: [],
      saveDirName: 'DT_GameDataTable',
      saveDirHandle: null,
      types: [
        { type: 'Wall', label: 'Wall' },
        { type: 'Box', label: 'Box' },
        { type: 'Goal', label: 'Goal' },
        { type: 'Player', label: 'Player' },
        { type: 'Empty', label: 'Empty' },
      ],
    });

    function initGrid() {
      state.grid = [];
      for (let y = 0; y < state.rows; y++) {
        const row = [];
        for (let x = 0; x < state.cols; x++) {
          row.push({ x, y, type: 'Empty' });
        }
        state.grid.push(row);
      }
      applyGridCss();
    }

    function applyGridCss(){
      const gridEl = document.querySelector('.grid');
      if(!gridEl) return;
      gridEl.style.gridTemplateColumns = `repeat(${state.cols}, 36px)`;
    }

    function cloneGrid(grid){
      return grid.map(row => row.map(cell => ({ x: cell.x, y: cell.y, type: cell.type })));
    }

    function pushHistory(){
      state.history.push({ grid: cloneGrid(state.grid), cols: state.cols, rows: state.rows });
      if(state.history.length > 100) state.history.shift();
    }

    onMounted(() => {
      initGrid();
      window.addEventListener('mouseup', ()=> state.mouseDown = false);
    });

    const flatGrid = computed(()=> {
      const arr = [];
      for (let y=0;y<state.rows;y++) for (let x=0;x<state.cols;x++) arr.push(state.grid[y][x]);
      return arr;
    });

    function dragStart(type){
      return function(ev){
        ev.dataTransfer.setData('text/plain', type);
      }
    }

    function onDrop(ev,x,y){
      const type = ev.dataTransfer.getData('text/plain');
      if(type) setCellType(x,y,type);
    }

    function setCellType(x,y,type){
      if(!state.grid[y]||!state.grid[y][x]) return;
      const cell = state.grid[y][x];
      if(cell.type === type) return;
      pushHistory();
      if(type==='Player'){
        for(let r of state.grid) for(let c of r) if(c.type==='Player') c.type='Empty';
      }
      cell.type = type;
    }

    function selectType(type){ currentType.value = type }

    function shortLabel(type){
      switch(type){ case 'Wall': return 'W'; case 'Box': return 'B'; case 'Goal': return 'G'; case 'Player': return 'P'; default: return '' }
    }

    function cellInfo(cell){
      return cell ? `(${cell.x},${cell.y}) ${cell.type}` : '';
    }

    function startPaint(x,y){
      state.mouseDown = true;
      setCellType(x,y,currentType.value);
    }

    function paintIfDown(x,y){ if(state.mouseDown) setCellType(x,y,currentType.value); }

    function resetGrid(){
      pushHistory();
      initGrid();
    }

    function clearCell(x,y){
      if(!state.grid[y]||!state.grid[y][x]) return;
      const cell = state.grid[y][x];
      if(cell.type === 'Empty') return;
      pushHistory();
      cell.type = 'Empty';
    }

    function applyGridSize(){
      const cols = Math.max(3, Math.min(50, Math.floor(newCols.value)));
      const rows = Math.max(3, Math.min(50, Math.floor(newRows.value)));
      if(cols === state.cols && rows === state.rows) return;
      pushHistory();
      const newGrid = [];
      for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
          if (y < state.grid.length && x < state.grid[0]?.length) {
            row.push({ x, y, type: state.grid[y][x].type });
          } else {
            row.push({ x, y, type: 'Empty' });
          }
        }
        newGrid.push(row);
      }
      state.cols = cols;
      state.rows = rows;
      state.grid = newGrid;
      newCols.value = cols;
      newRows.value = rows;
      applyGridCss();
    }

    function undo(){
      if(state.history.length === 0) return;
      const prev = state.history.pop();
      state.grid = cloneGrid(prev.grid);
      state.cols = prev.cols;
      state.rows = prev.rows;
      applyGridCss();
    }

    function getExportLevelNum(){
      const num = Math.max(1, Math.floor(state.levelNum));
      return num;
    }

    function downloadCSV(fileName, csv){
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    async function chooseSaveDir(){
      if(!window.showDirectoryPicker){
        alert('当前浏览器不支持直接选择目录，请使用普通下载。');
        return;
      }
      try {
        const dirHandle = await window.showDirectoryPicker();
        state.saveDirHandle = dirHandle;
        state.saveDirName = dirHandle.name || 'DT_GameDataTable';
      } catch (err) {
        console.warn('选择目录已取消或不支持：', err);
      }
    }

    async function exportCSV(){
      const exportLevelNum = getExportLevelNum();
      const rows = [];
      rows.push(['行命名','LevelNum','X','Y','ActorType'].join(','));
      let seq = 1;
      for(let y=0;y<state.rows;y++){
        for(let x=0;x<state.cols;x++){
          const actor = state.grid[y][x].type || 'Empty';
          rows.push([seq, exportLevelNum, x, y, actor].join(','));
          seq++;
        }
      }
      const csv = '\ufeff' + rows.join('\r\n');
      const fileName = `level_${exportLevelNum}.csv`;

      if(state.saveDirHandle && window.showDirectoryPicker){
        try {
          const fileHandle = await state.saveDirHandle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(csv);
          await writable.close();
          alert(`已保存到目录：${state.saveDirName}，文件名：${fileName}`);
          return;
        } catch (err) {
          console.warn('目录写入失败，改为下载：', err);
        }
      }

      downloadCSV(fileName, csv);
    }

    const hoverInfo = computed(() => state.hoverCell ? cellInfo(state.hoverCell) : '无');

    return {
      ...toRefs(state),
      currentType,
      newCols,
      newRows,
      initGrid,
      flatGrid,
      dragStart,
      onDrop,
      setCellType,
      selectType,
      shortLabel,
      startPaint,
      paintIfDown,
      resetGrid,
      clearCell,
      exportCSV,
      chooseSaveDir,
      applyGridCss,
      applyGridSize,
      hoverInfo,
      cellInfo
    };
  }
}).mount('#app');
