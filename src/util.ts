import { Queue, ReactRNPlugin, RemId, RNPlugin } from "@remnote/plugin-sdk";
import { RemObject } from "@remnote/plugin-sdk/dist/name_spaces/rem";


// Look for a rem based on text.
export async function getRemByText(
  plugin: ReactRNPlugin, 
  text: string, parentId: 
  RemId | null): Promise<RemObject | undefined> {
  const richTextValue = await plugin.richText.text(text).value();
  const rem = await plugin.rem.findByName(richTextValue, parentId);
  return rem;
}

/**
 * Finds all rems that have the specified rem as a tag
 * @param tagRem - The rem to search for as a tag
 * @returns An array of rems that have the input rem as a tag
 */
export async function getRemsByTag(tagRem: RemObject): Promise<RemObject[]> {
  return await tagRem.taggedRem();
}

// Check if a rem has the priority powerup
export async function hasPriorityPowerup(rem: RemObject): Promise<boolean> {
  return rem.hasPowerup("priorityCode");
}

/**
 * Assigns a priority value to a Rem object
 * @param plugin - The plugin instance
 * @param rem - The Rem object to assign priority to
 * @param priority - The integer priority value to assign
 */
export async function assignPriorityToRem(plugin: ReactRNPlugin, rem: RemObject, priority: number) {
  const priorityText = await plugin.richText.text(priority.toString()).value();
  await rem.setPowerupProperty("priorityCode", "priorityValue", priorityText);
}

/**
 * Gets the priority value from a Rem object
 * @param plugin - The plugin instance
 * @param rem - The Rem object to get the priority from
 * @returns The priority value as an integer, or undefined if not found
 */
export async function getPriorityFromRem(plugin: ReactRNPlugin, rem: RemObject): Promise<number | undefined> {
  const priorityValue = await rem.getPowerupProperty("priorityCode", "priorityValue");
  if (!priorityValue) {
    return undefined;
  }  
  return parseInt(priorityValue, 10);
}

/**
 * Gets the number of due flashcards
 * @param plugin - The RemNote plugin instance
 * @returns The number of flashcards that are due for review
 */
export async function getDueFlashcardsCount(plugin: ReactRNPlugin): Promise<number> {
  try {
    const now = Date.now();
    const allCards = await plugin.card.getAll();
    const dueCards = allCards.filter(card => 
      card.nextRepetitionTime && card.nextRepetitionTime <= now
    );
    return dueCards.length;
  } catch (error) {
    console.error("Error fetching due flashcards:", error);
    return 0;
  }
}

/**
 * Opens a rem as a page and its first source in context if available
 * @param rem - The rem to open
 */
export async function openRemAsPageWithContext(rem: RemObject) {
  await rem.openRemAsPage();
  const sources = await rem.getSources();
  if (sources && sources.length > 0) {
    sources[0].openRemInContext();
  }
}

/**
 * Opens the flashcard homepage
 * @param plugin - The RemNote plugin instance
 */
export async function openFlashcardHomepage(plugin: ReactRNPlugin) {
  await plugin.window.setURL('/queue');
}
