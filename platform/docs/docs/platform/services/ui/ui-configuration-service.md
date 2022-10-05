---
sidebar_position: 3
sidebar_label: UI Modal Service
---
# UI Configuration Service

There are a lot of places where users may want to configure certain elements
differently between different modes or for different deployments.  A mode
example might be the ability to select a different right click context menu
for the cornerstone extension.  A deployment example might be the ability to add
a selector for the data source back end to use to the study results table.

The use of this service enables these to be defined in a typed fashion by
providing an easy way to set default values for this, but to allow a non
default value to be specified by the configuration or mode.

This service is a UI service in that part of the registration allows for registering
UI components and types to deal with.

## Mode Customizations
The mode customizations are retrieved via the `getModeCustomization` function,
providing an id, and optionally a default value.

```ts
   cornerstoneOverlay = uiConfigurationService.getModeCustomization("cornerstoneOverlay", {uiType: "ohif.cornerstoneOverlay", ...});
   const { component: overlayComponent, props} = uiConfigurationService.getComponent(cornerstoneOverlay);
   return (<defaultComponent {...props} overlay={cornerstoneOverlay}....></defaultComponent>);
```

This example shows fetching the default component to render this object.  Alternatively,
the typeInfo may be a command object, for example:

```ts
   cornerstoneContextMenu = uiConfigurationService.getModeCustomization("cornerstoneContextMenu", defaultMenu);
   uiConfigurationService.recordInteraction(cornerstoneContextMenu, extraProps);
```

### Registering Mode Customizations
To create a mode customization, the configuration service needs to be reset on
loading the mode, and then any custom modes can be added either with the
loadModesFromModules call, or by passing in a set of customizations to apply.
For example:

```js
uiCustomizationService.reset();
uiCustomizationService.

### Applying Mode Customizations
The mode should call `resetModeCustomizations(extensionsToDefaultTo)` with a list
of the extension id's to include the mode customizations on.  The list may be
null or empty to set mode customizations to an empty list.  It may additionally
call `setModeCustomization` to specify customizations by id/value, in order
to specify in-line customizations.

## Global Customizations
The global customizations are controlled by the configuration on the
`guiCustomizationService` configuration object, as specified by the
`AppConfig` provided.  Additional configurations may be specified by
extensions.  These will not be able to be turned off by the AppConfig, and
will apply as soon as the extension is loaded.

The use of global customizations is the same as for mode customizations, except
retrieved as `getGlobalCustomization`.

The setting of global customizations is intended to occur at startup time,
or if updated in a configuration panel, then as specified in that panel.  It is
possible to get event notifications on changes, but mostly the values are expected
to be used as provided when the `get...Customization` call is made.

## Types
The type interface is modelled after the type interface in the ToolBarService.
Extensions can register a set of types by creating a function `getCustomizationModule`,
return an array of types of the form:

```ts
    {
      name: 'ohif.contextMenu',
      defaultComponent: ContextMenu,
      itemType: ContextMenuType, // Has a type definition for this value
      // Other attributes
      clickHandler: () => {},
    },
```

> 3rd Party implementers may be added to this table via pull requests.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[interface]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/UIModalService/index.js
[modal-provider]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/contextProviders/ModalProvider.js
[modal-consumer]: https://github.com/OHIF/Viewers/tree/master/platform/ui/src/components/ohifModal
[ux-article]: https://uxplanet.org/best-practices-for-modals-overlays-dialog-windows-c00c66cddd8c
<!-- prettier-ignore-end -->
