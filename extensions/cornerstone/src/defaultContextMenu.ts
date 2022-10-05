import { ContextMenuMeasurements } from '@ohif/ui';
import { Types } from '@ohif/core';

const defaultContextMenu: Types.CommandUICustomization = {
  id: 'cornerstoneContextMenu',
  uiType: 'ohif.contextMenu',
  items: [
    // Get the items from the UI Customization for the menu name (and have a custom name)
    {
      id: 'forExistingMeasurement',
      selector: ({ nearbyToolData }) => !!nearbyToolData,
      items: [
        {
          label: 'Delete measurement',
          actionType: 'RunCommands',
          commands: [
            {
              commandName: 'deleteMeasurement',
            },
          ],
        },
        {
          label: 'Add Label',
          actionType: 'RunCommands',
          commands: [
            {
              commandName: 'setLabel',
            },
          ],
        },
      ],
    },
  ],
};

export default defaultContextMenu;
