import merge from 'lodash.merge';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import UITypeInfo from './UITypeInfo';
import { UICustomization, UIConfiguration } from './types';
import { ComponentType } from 'react';

const EVENTS = {
  MODE_CUSTOMIZATION_MODIFIED: 'event::UICustomizationService:modeModified',
  GLOBAL_CUSTOMIZATION_MODIFIED: 'event::UICustomizationService:globalModified',
};

interface UICustomizationConfiguration {
  globalConfiguration?: string[];
}

type ComponentReturn = {
  component: ComponentType;
  props?: Record<string, unknown>;
};

type NestedStrings = string[] | NestedStrings[];

type CustomizationModuleEntry = UICustomization | UITypeInfo;

const flattenNestedStrings = (
  strs: NestedStrings | string,
  ret?: Record<string, string>
): Record<string, string> => {
  if (!ret) ret = {};
  if (!strs) return ret;
  if (Array.isArray(strs)) {
    for (const val of strs) {
      flattenNestedStrings(val, ret);
    }
  } else {
    ret[strs] = strs;
  }
  return ret;
};

export default class UICustomizationService extends PubSubService {
  _commandsManager: Record<string, unknown>;
  extensionManager: Record<string, unknown>;

  modeCustomizations: Record<string, UICustomization> = {};
  globalCustomizations: Record<string, UICustomization> = {};
  customizationTypes: Record<string, UITypeInfo>;
  configuration: UICustomizationConfiguration;

  constructor({ configuration, commandsManager }) {
    super(EVENTS);
    this._commandsManager = commandsManager;
    this.configuration = configuration;
  }

  init(extensionManager): void {
    this.extensionManager = extensionManager;
    this.readCustomizationTypes(
      v => v.uiType == 'uiType' && v,
      this.customizationTypes
    );
    this.setConfigGlobalCustomization(this.configuration);
  }

  reset(): void {
    super.reset();
    this.modeCustomizations = {};
  }

  /**
   *
   * @param {*} interaction - can be undefined to run nothing
   * @param {*} extraOptions to include in the commands run
   */
  recordInteraction(
    interaction: UICustomization | void,
    extraOptions?: Record<string, unknown>
  ): void {
    if (!interaction) return;
    const commandsManager = this._commandsManager;
    const { commands = [] } = interaction;

    commands.forEach(({ commandName, commandOptions, context }) => {
      if (commandName) {
        console.log('Running command', commandName);
        commandsManager.runCommand(
          commandName,
          {
            interaction,
            ...commandOptions,
            ...extraOptions,
          },
          context
        );
      } else {
        console.warn('No command name supplied in', interaction);
      }
    });
  }

  getModeCustomizations(): Record<string, UICustomization> {
    return this.modeCustomizations;
  }

  setModeCustomization(
    customizationId: string,
    customization: UICustomization
  ): void {
    this.modeCustomizations[customizationId] = merge(
      this.modeCustomizations[customizationId] || {},
      customization
    );
    this._broadcastEvent(this.EVENTS.CUSTOMIZATION_MODIFIED, {
      buttons: this.modeCustomizations,
      button: this.modeCustomizations[customizationId],
    });
  }

  /** Mode customizations are changes to the behaviour of the extensions
   * when running in a given mode.  Reset clears mode customizations.
   * @param defautlValue to return if no customization specified.
   */
  getModeCustomization(
    customizationId: string,
    defaultValue?: UICustomization
  ): UICustomization | void {
    return this.modeCustomizations[customizationId] ?? defaultValue;
  }

  loadModeCustomizations(...config: NestedStrings): void {
    this.modeCustomizations = {};
    const keys = flattenNestedStrings(config);
    this.readCustomizationTypes(
      v => keys[v.name] && v.customization,
      this.modeCustomizations
    );

    // TODO - iterate over customizations, loading them from the extension
    // manager.
    this._broadcastModeCustomizationModified();
  }

  addModeCustomizations(modeCustomizations: UICustomization[]): void {
    if (!modeCustomizations) {
      return;
    }
    modeCustomizations.forEach(entry => {
      if (!this.modeCustomizations[entry.id]) {
        this.modeCustomizations[entry.id] = entry;
      }
    });

    this._broadcastModeCustomizationModified();
  }

  _broadcastModeCustomizationModified(): void {
    this._broadcastEvent(EVENTS.MODE_CUSTOMIZATION_MODIFIED, {
      modeCustomizations: this.modeCustomizations,
      globalCustomizations: this.globalCustomizations,
    });
  }

  /** Global customizations are those that affect parts of the GUI other than
   * the modes.  They include things like settings for the search screen.
   * Reset does NOT clear global customizations.
   */
  getGlobalCustomization(
    id: string,
    defaultValue?: UICustomization
  ): UICustomization | void {
    return this.globalCustomizations[id] ?? defaultValue;
  }

  setGlobalCustomization(id: string, value: UICustomization): void {
    this.globalCustomizations[id] = value;
    this._broadcastGlobalCustomizationModified();
  }

  getTypeInfo(uiType?: string, defaultUiType?: UITypeInfo): UITypeInfo {
    if (!uiType) return defaultUiType;
    return this.customizationTypes[uiType] ?? defaultUiType;
  }

  protected setConfigGlobalCustomization(configuration: UIConfiguration): void {
    this.globalCustomizations = {};
    const keys = flattenNestedStrings(configuration.globalCustomizations);
    this.readCustomizationTypes(
      v => keys[v.name] && v.customization,
      this.globalCustomizations
    );

    // TODO - iterate over customizations, loading them from the extension
    // manager.
    this._broadcastGlobalCustomizationModified();
  }

  _broadcastGlobalCustomizationModified(): void {
    this._broadcastEvent(EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED, {
      modeCustomizations: this.modeCustomizations,
      globalCustomizations: this.globalCustomizations,
    });
  }

  /** Gets the component and props value for the component from a
   * UICustomization object, taking into account the default type info.
   */
  public getComponent(
    customization: UICustomization,
    defaultUiType?: UITypeInfo
  ): ComponentReturn | void {
    const uiType = this.getTypeInfo(customization.uiType, defaultUiType);
    const component = (customization?.component ||
      uiType?.component) as ComponentType;
    if (!component) return;
    const props = (customization?.props || uiType?.props) as Record<
      string,
      unknown
    >;
    return { component, props };
  }

  // Add registration for uiType - should it auto-register?
  protected readCustomizationTypes(
    readValue: (v: CustomizationModuleEntry) => UITypeInfo | UICustomization,
    dest: Record<string, unknown>
  ): void {
    const registeredCustomizationModules = this.extensionManager.modules[
      'uiCustomizationModule'
    ];

    if (
      Array.isArray(registeredCustomizationModules) &&
      registeredCustomizationModules.length
    ) {
      registeredCustomizationModules.forEach(customizationModule =>
        customizationModule.module.forEach(def => {
          console.log('Checking', def, 'in', keys);
          const assignValue = readValue(def);
          if (!assignValue) return;
          dest[def.id] = assignValue;
        })
      );
    }
  }
}
