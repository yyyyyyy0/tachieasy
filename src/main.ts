import './styles.css';
import { state } from './state';
import { initImageLoading, renderImgList } from './image-loading';
import { drawStage, initRoi, setRef as roiSetRef, updateRoiUI } from './roi';
import { initCrops, renderCropList } from './crops';
import { initFormat } from './format';
import { initTile } from './tile';
import { initTheme } from './theme';
import { initHelpModal } from './help-modal';
import { initTip } from './tip';

const setRef = (id: string): void => {
  roiSetRef(id);
  renderImgList(deps);
  drawStage();
  updateRoiUI();
};

const deps = {
  setRef,
  drawStage,
  updateRoiUI,
  renderCropList,
};

initTheme();
initImageLoading(deps);
initRoi();
initCrops();
initFormat();
initTile();
initHelpModal();
initTip();
updateRoiUI();

// touch state to silence unused-import in stripped builds when re-exported elsewhere
void state;
