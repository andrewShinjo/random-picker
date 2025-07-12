import { declareIndexPlugin, ReactRNPlugin, Rem } from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {
  await plugin.app.registerCommand({
    id: 'pick-random-note',
    name: 'Pick random note',
    action: async () => {

      // Find the Project tag
      const richTextInterface = await plugin.richText.text("Project").value();
      const projectTag = await plugin.rem.findByName(richTextInterface, null);

      if (!projectTag) {
        console.log('No "Project" tag found');
        return;
      }


      // Get all rems tagged with "Project"
      const projectDocs = await projectTag.taggedRem();
      const openedRems = await plugin.window.getOpenPaneRemIds();
      const filteredProjectDocs = projectDocs.filter((projectDoc) => !openedRems.includes(projectDoc._id))

      // Randomly open one of the rems and their source (if it exists)
      if (filteredProjectDocs && filteredProjectDocs.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredProjectDocs.length);
        const randomProject = filteredProjectDocs[randomIndex];
        await randomProject.openRemAsPage();

        const sources = await randomProject.getSources();
        if (sources && sources.length > 0) {
          sources[0].openRemInContext();
        }
      }
    }
  });
}

async function onDeactivate(_: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);
