import UICustomizationService from './UICustomizationService';

const UICustomizationServiceRegistration = {
  name: 'uiCustomizationService',
  create: ({ configuration = {}, commandsManager }) => {
    return new UICustomizationService({ configuration, commandsManager });
  },
};

console.log(
  'Creating UICustomizationServiceRegistration',
  UICustomizationServiceRegistration
);
export default UICustomizationServiceRegistration;
export { UICustomizationService, UICustomizationServiceRegistration };
