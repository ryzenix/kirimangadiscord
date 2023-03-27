const readingSessionDatabase = require("../database/readingSessions");
const MFA = require("mangadex-full-api");

exports.run = async (client, interaction) => {
    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    await interaction.deferUpdate();

    const session = await readingSessionDatabase.findOne({
        messageId
    });

    if (!session)
        return interaction.followUp({
            content:
                "This session is no longer avaliable to interact with <:Sapo:1078667608196391034>",
            ephemeral: true,
        });
    if (!session.share && session.userId !== userId)
    return interaction.followUp({
        content:
            "This session is locked and only accessible by its owner only. Other users can interact once the owner of this session share it using \`/session share\`!",
        ephemeral: true,
    });
    

    const { mangaId, currentChapter, translatedLanguage } = session;

    const manga = await MFA.Manga.get(mangaId).catch((err) => {
        client.logger.error(err);
        return interaction.followUp({ content: `An error occured when i go grab the results. (likely not from your side) Please inform the developer about this.\nError message: \`${err.message}\``, ephemeral: true });
    });

    let chapters = await MFA.Manga.getFeed(mangaId, { limit: Infinity, translatedLanguage: [translatedLanguage], order: {
        chapter: 'asc'
    }});

    const filtered = chapters.filter((chapter) => Number(chapter.chapter) > Number(currentChapter));
    if (filtered.length === 0) return interaction.followUp({ content: 'There is no more chapter as of now <:Sapo:1078667608196391034>', ephemeral : true })
    else return client.manga.handleInitialRead(filtered[0], manga, interaction);
}


exports.info = {
    name: "nextchapterreadbtn"
}