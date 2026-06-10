const { createApp, reactive, computed, ref, onMounted } = Vue;

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

    function exportCSV(){
      const rows = [];
      rows.push(['行命名','LevelNum','X','Y','ActorType'].join(','));
      let seq = 1;
      for(let y=0;y<state.rows;y++){
        for(let x=0;x<state.cols;x++){
          const actor = state.grid[y][x].type || 'Empty';
          rows.push([seq, state.levelNum, x, y, actor].join(','));
          seq++;
        }
      }
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level_${state.levelNum}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    const hoverInfo = computed(() => state.hoverCell ? cellInfo(state.hoverCell) : '无');

    return {
      ...state,
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
      applyGridCss,
      applyGridSize,
      hoverInfo,
      cellInfo
    };
  }
}).mount('#app');
