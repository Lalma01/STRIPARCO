package com.striparco.app

/**
 * Domain & keyword lists ported verbatim from the Windows build (main.js).
 * BUILTIN_DOMAINS are blocked at the DNS layer; ALLOWED_DOMAINS are never blocked.
 * STRONG/WEAK/WHITELIST keywords drive the browser-title monitor.
 */
object Blocklist {

    val BUILTIN_DOMAINS = listOf(
        // NSFW Porn
        "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
        "youporn.com", "tube8.com", "beeg.com", "spankbang.com", "eporner.com",
        "brazzers.com", "bangbros.com", "naughtyamerica.com", "chaturbate.com",
        "cam4.com", "myfreecams.com", "livejasmin.com", "stripchat.com",
        "bongacams.com", "onlyfans.com", "nhentai.net", "hentaihaven.xxx",
        "e621.net", "gelbooru.com", "rule34.xxx", "danbooru.donmai.us",
        "jerkmate.com", "camsoda.com", "flirt4free.com", "adulttime.com",
        "realitykings.com", "mofos.com", "tnaflix.com", "porndig.com",
        "drtuber.com", "slutload.com", "xtube.com", "pornmd.com", "keezmovies.com",
        // NSFW AI Chat
        "spicychat.ai", "crushon.ai", "janitorai.com", "candy.ai", "muah.ai",
        "dreamgf.ai", "dreambf.ai", "erogen.ai", "intimateai.com",
        "character.ai", "naughtydog.ai", "kindroid.ai", "soulgen.ai", "venus.chub.ai",
        // NSFW AI Image generators
        "civitai.com", "pornpen.ai", "aiporncreator.ai", "nudify.online",
        "seduced.ai", "promptchan.ai", "undress.app", "deepnude.cc", "nsfwgenerator.ai",
        "replika.com", "yodayo.com",
        // AI Image generators (non-NSFW chatbots are intentionally NOT blocked)
        "perchance.org", "midjourney.com", "leonardo.ai", "nightcafe.studio",
        "lexica.art", "playgroundai.com", "craiyon.com", "stablediffusionweb.com",
        "mage.space", "tensor.art", "runwayml.com", "ideogram.ai", "krea.ai",
        "designer.microsoft.com"
    )

    // Mainstream AI assistants that must stay accessible (never blocked).
    val ALLOWED_DOMAINS = listOf(
        "grok.com", "claude.ai", "perplexity.ai", "gemini.google.com", "x.com",
        "chatgpt.com", "chat.openai.com", "openai.com", "copilot.microsoft.com",
        "poe.com", "you.com", "pi.ai", "bard.google.com"
    )

    // Strong keywords: a single match blocks.
    val STRONG_KEYWORDS = listOf(
        "pornhub", "xvideos", "xnxx", "xhamster", "redtube", "youporn", "onlyfans",
        "chaturbate", "spankbang", "stripchat", "spicychat", "crushon", "janitorai",
        "character.ai", "nudify", "pornpen", "civitai", "nhentai", "rule34",
        "porn", "xxx", "nsfw", "hentai", "live sex", "sex chat", "adult content",
        "replika", "candy.ai", "dreamgf", "dreambf", "muah.ai", "soulgen", "kindroid",
        "deepnude", "undress", "seduced.ai", "promptchan", "aiporncreator", "nsfwgenerator",
        "perchance", "midjourney", "leonardo.ai", "nightcafe", "lexica.art", "playgroundai",
        "craiyon", "mage.space", "tensor.art", "ideogram", "image generator", "képgenerátor"
    )

    // Weak/ambiguous keywords: block only when at least two appear in the same title.
    val WEAK_KEYWORDS = listOf(
        "sex", "sexy", "nude", "naked", "dating", "hookup", "free date", "meet singles",
        "meet girls", "hot women", "escort", "sugar daddy", "megismerkedés"
    )

    // Titles of these mainstream AI assistants are never blocked.
    val WHITELIST_AI_KEYWORDS = listOf(
        "grok", "claude", "perplexity", "gemini", "chatgpt", "copilot", "openai", "pi.ai", "you.com"
    )

    /** Returns true if [domain] (or a parent of it) is on the allow list. */
    fun isAllowed(domain: String): Boolean {
        val d = domain.lowercase().removePrefix("www.")
        return ALLOWED_DOMAINS.any { d == it || d.endsWith(".$it") }
    }

    /**
     * The full effective block set for DNS: builtin + custom, minus anything on the allow list.
     * Mirrors updateHosts() filtering in main.js.
     */
    fun effectiveDomains(custom: Collection<String>): Set<String> {
        val all = LinkedHashSet<String>()
        all.addAll(BUILTIN_DOMAINS)
        // Custom entries that look like domains (contain a dot, no spaces) act as DNS blocks too.
        all.addAll(custom.filter { it.contains('.') && !it.contains(' ') })
        return all.filterNot { isAllowed(it) }.toSet()
    }
}
