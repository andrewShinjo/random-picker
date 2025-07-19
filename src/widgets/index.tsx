import { declareIndexPlugin, ReactRNPlugin } from '@remnote/plugin-sdk';
import { openFlashcardHomepage, getDueFlashcardsCount, getRemByText, getRemsByTag, getPriorityFromRem, hasPriorityPowerup, openRemAsPageWithContext, assignPriorityToRem } from '../util';
import { RemObject } from "@remnote/plugin-sdk/dist/name_spaces/rem";
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {

  await plugin.app.registerPowerup({
    name: "Priority",
    code: "priorityCode",
    description: "Priority in selecting task to open",
    options: { slots: [{ code: "priorityValue", name: "Priority Value" }] }
  });

  // Add new action type for flashcard homepage
  const OPEN_FLASHCARD_HOMEPAGE = "OPEN_FLASHCARD_HOMEPAGE";

  await plugin.app.registerCommand({
    id: 'pick-random-note',
    name: 'Pick random note',
    action: async () => {
      // Get due flashcard count
      const dueFlashcardsCount = await getDueFlashcardsCount(plugin);

      // Create flashcard homepage action with priority = due count
      const flashcardAction = {
        type: OPEN_FLASHCARD_HOMEPAGE,
        priority: dueFlashcardsCount
      };

      // Find the Project tag
      const projectRem = await getRemByText(plugin, "Project", null);

      if (!projectRem) {
        console.log('No "Project" tag found');
        return;
      }

      const projectDocs = await getRemsByTag(projectRem);
      const openedRems = await plugin.window.getOpenPaneRemIds();
      const filteredProjectDocs = projectDocs.filter((projectDoc: RemObject) =>
        !openedRems.includes(projectDoc._id)
      );

      // Apply priority weighting if available
      const projectActions = await Promise.all(filteredProjectDocs.map(async (project: RemObject) => {
        if (!(await hasPriorityPowerup(project))) {
          await assignPriorityToRem(plugin, project, 1);
        }
        const priority = (await getPriorityFromRem(plugin, project)) || 1;
        return {
          type: 'PROJECT',
          priority,
          rem: project
        };
      }));

      // Create separate weighted arrays
      const projectWeighted = projectActions.flatMap((action: { type: string, priority: number, rem: RemObject }) =>
        Array(action.priority).fill(action)
      );

      console.log(`dueFlashcards: ${dueFlashcardsCount}`);

      const flashcardWeighted = dueFlashcardsCount > 0
        ? Array(dueFlashcardsCount).fill(flashcardAction)
        : [];

      // Combine both arrays
      const allWeightedActions = [...projectWeighted, ...flashcardWeighted];

      console.log(allWeightedActions);

      // Randomly select an action
      if (allWeightedActions.length === 0) {
        plugin.app.toast("No actions available");
        return;
      }

      // Get last action type from storage
      const lastActionType: string | undefined = await plugin.storage.getSynced('lastActionType');

      // Filter out actions that match the last action type if it exists
      const filteredActions = lastActionType
        ? allWeightedActions.filter(action => action.type !== lastActionType)
        : allWeightedActions;

      // Use filtered list if it has actions, otherwise use original list
      const candidateActions = filteredActions.length > 0 ? filteredActions : allWeightedActions;

      if (candidateActions.length === 0) {
        plugin.app.toast("No actions available");
        return;
      }

      const randomIndex = Math.floor(Math.random() * candidateActions.length);
      const selectedAction = candidateActions[randomIndex];

      // Store the selected action type for next time
      await plugin.storage.setSynced('lastActionType', selectedAction.type);

      // Execute selected action
      if (selectedAction.type === 'PROJECT') {
        console.log("Open project.");
        await openRemAsPageWithContext(selectedAction.rem);
      } else if (selectedAction.type === OPEN_FLASHCARD_HOMEPAGE) {
        console.log("Open flashcard home.");
        await openFlashcardHomepage(plugin);
      }
    }
  });
}

async function onDeactivate(_: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);
