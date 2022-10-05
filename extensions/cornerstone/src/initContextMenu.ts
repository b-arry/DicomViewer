import { eventTarget, Types, EVENTS } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';
import { setEnabledElement } from './state';
import { ContextMenuMeasurements } from '@ohif/ui';

const cs3DToolsEvents = Enums.Events;

const showContextMenuDefault: Types.CommandUICustomization = {
  commands: [
    {
      commandName: 'showViewerContextMenu',
      commandOptions: {
        menuName: 'cornerstoneContextMenu',
        content: ContextMenuMeasurements,
      },
      context: 'CORNERSTONE',
    },
  ],
};

function initContextMenu({
  CornerstoneViewportService,
  uiCustomizationService,
  commandsManager,
}): void {
  const getShowContextMenu = (): Types.UICommand =>
    uiCustomizationService.getModeCustomization(
      'showContextMenu',
      showContextMenuDefault
    );

  const showContextMenu = (contextMenuProps): void => {
    uiCustomizationService.recordInteraction(
      getShowContextMenu(),
      contextMenuProps
    );
  };

  const onRightClick = event => {
    showContextMenu({
      event,
      nearbyToolData: undefined,
    });
  };

  // TODO No CS3D support yet
  // const onTouchPress = event => {
  //   showContextMenu({
  //     event,
  //     nearbyToolData: undefined,
  //     isTouchEvent: true,
  //   });
  // };

  const resetContextMenu = () => {
    commandsManager.runCommand('closeViewerContextMenu');
  };

  /*
   * Because click gives us the native "mouse up", buttons will always be `0`
   * Need to fallback to event.which;
   *
   */
  const contextMenuHandleClick = evt => {
    const mouseUpEvent = evt.detail.event;
    const isRightClick = mouseUpEvent.which === 3;

    const clickMethodHandler = isRightClick ? onRightClick : resetContextMenu;
    clickMethodHandler(evt);
  };

  // const cancelContextMenuIfOpen = evt => {
  //   if (CONTEXT_MENU_OPEN) {
  //     resetContextMenu();
  //   }
  // };

  function elementEnabledHandler(evt) {
    const { viewportId, element } = evt.detail;
    const viewportInfo = CornerstoneViewportService.getViewportInfo(viewportId);
    const viewportIndex = viewportInfo.getViewportIndex();
    // TODO check update upstream
    setEnabledElement(viewportIndex, element);

    element.addEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );
  }

  function elementDisabledHandler(evt) {
    const { element } = evt.detail;

    element.removeEventListener(
      cs3DToolsEvents.MOUSE_CLICK,
      contextMenuHandleClick
    );
  }

  eventTarget.addEventListener(
    EVENTS.ELEMENT_ENABLED,
    elementEnabledHandler.bind(null)
  );

  eventTarget.addEventListener(
    EVENTS.ELEMENT_DISABLED,
    elementDisabledHandler.bind(null)
  );
}

export default initContextMenu;
