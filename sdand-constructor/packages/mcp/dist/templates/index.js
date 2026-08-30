import * as emptyStudio from './empty-studio';
import * as gardenHouse from './garden-house';
import * as twoBedroom from './two-bedroom';
function makeEntry(template, metadata) {
    return {
        id: metadata.id,
        name: metadata.name,
        description: metadata.description,
        template,
    };
}
export const TEMPLATES = {
    'empty-studio': makeEntry(emptyStudio.template, emptyStudio.metadata),
    'two-bedroom': makeEntry(twoBedroom.template, twoBedroom.metadata),
    'garden-house': makeEntry(gardenHouse.template, gardenHouse.metadata),
};
/** Type guard for external callers that receive arbitrary string ids. */
export function isTemplateId(id) {
    return Object.hasOwn(TEMPLATES, id);
}
