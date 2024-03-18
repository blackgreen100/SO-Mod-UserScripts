// ==UserScript==
// @name         Custom Mod Message Templates V2
// @description  Adds mod message templates with default configurations to the mod message drop-down
// @homepage     https://github.com/HenryEcker-SO-UserScripts/SO-Mod-UserScripts
// @author       Henry Ecker (https://github.com/HenryEcker)
// @version      0.1.2
// @downloadURL  https://github.com/HenryEcker-SO-UserScripts/SO-Mod-UserScripts/raw/master/ModMessageHelper/dist/ModMessageHelper.user.js
//
// @match        *://*.askubuntu.com/users/message/create/*
// @match        *://*.mathoverflow.net/users/message/create/*
// @match        *://*.serverfault.com/users/message/create/*
// @match        *://*.stackapps.com/users/message/create/*
// @match        *://*.stackexchange.com/users/message/create/*
// @match        *://*.stackoverflow.com/users/message/create/*
// @match        *://*.superuser.com/users/message/create/*
//
// @grant        none
//
// ==/UserScript==
/* globals StackExchange, $ */
(function() {
  "use strict";
  function ajaxPostWithData(endPoint, data, shouldReturnData = true) {
    return new Promise((resolve, reject) => {
      void $.ajax({
        type: "POST",
        url: endPoint,
        data
      }).done((resData, textStatus, xhr) => {
        resolve(
          shouldReturnData ? resData : {
            status: xhr.status,
            statusText: textStatus
          }
        );
      }).fail((res) => {
        reject(res.responseText ?? "An unknown error occurred");
      });
    });
  }
  function annotateUser(userId, annotationDetails) {
    return ajaxPostWithData(
      `/admin/users/${userId}/annotate`,
      {
        fkey: StackExchange.options.user.fkey,
        annotation: annotationDetails
      },
      false
    );
  }
  function isInValidationBounds(textLength, bounds) {
    const min = bounds.min ?? 0;
    if (bounds.max === void 0) {
      return min <= textLength;
    }
    return min <= textLength && textLength <= bounds.max;
  }
  const annotationTextLengthBounds = { min: 10, max: 300 };
  function assertValidAnnotationTextLength(annotationLength) {
    if (!isInValidationBounds(annotationLength, annotationTextLengthBounds)) {
      throw new Error(`Annotation text must be between ${annotationTextLengthBounds.min} and ${annotationTextLengthBounds.max} characters.`);
    }
    return true;
  }
  StackExchange.ready(function() {
    if (!StackExchange?.options?.user?.isModerator) {
      return;
    }
    const parentUrl = StackExchange?.options?.site?.parentUrl ?? location.origin;
    const parentName = StackExchange.options?.site?.name;
    const customModMessages = [
      {
        AnalogousSystemReasonId: "LowQualityQuestions",
        TemplateName: "low quality answers",
        DefaultSuspendDays: 0,
        DefaultSuspensionReason: "because of low-quality contributions",
        TemplateBody: `One or more of your answers do not meet the quality standards of the site and have been deleted.

Common [reasons for deletion](${parentUrl}/help/deleted-answers) include:

- Answers that do not address the original question
- Answers that contain incorrect information and do not appear to be your own original work
- Answers that consist primarily of a link to an answer elsewhere
- Answers in a language other than English
- Answers that contain code, data, or other text in images that does not also appear as text

To review your deleted answers, please visit your ["deleted answers" page](${parentUrl}/users/deleted-answers/current). The link can also be found at the bottom of the [answers tab](${parentUrl}/users/current?tab=answers) on your profile.

If you believe a specific answer should not have been deleted, you can flag the post with an "*In need of moderator intervention*" flag and provide an explanation.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "closing spam",
        DefaultSuspendDays: 0,
        TemplateBody: `As you may have noticed, ${parentName} is currently under a spam wave, receiving a lot of "support number" spam posts.

While we appreciate your willingness to help us out with these as you see them, we noticed that you recently voted to close one or more of these questions. That is not very useful. **Instead of voting to close spam, you should flag it as spam.** You'll find that option at the very top of the "flag" dialog.

Flagging as spam is much more expedient than voting to close, and actually allows spam to be nuked from the site without moderator intervention even being required.

Thank you for your attention to this matter in the future. If you have any questions, please let us know!`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "soliciting votes",
        DefaultSuspendDays: 0,
        TemplateBody: `We noticed that you've been posting numerous comments asking other users for upvotes and/or accepts. This is not an appropriate use of comments.

Quoting from the [comment privilege page](${parentUrl}/help/privileges/comment):

> You should submit a comment if you want to:
> * Request **clarification** from the author;
> * Leave **constructive criticism** that guides the author in improving the post;
> * Add relevant but **minor or transient information** to a post (e.g. a link to a related question, or an alert to the author that the question has been updated).

Please refrain from leaving comments urging users to accept answers in the future. Such comments may be perceived as begging by other users. The system does have built-in contextual help that recommends new users accept an answer to their question at an appropriate time. Having the message come from the software itself, rather than a comment from a specific user, is preferable for several reasons:

First, it reduces the amount of noise on the site, since the message is displayed only on that user's screen, not as content that every future viewer to the Q&A will see. Second, it eliminates the possibility that your comment comes across as pressuring the user into accepting and/or upvoting your post. The reality is, no matter how politely and neutrally you phrase the comment, if you have also posted an answer to the question, the receiving user is extremely likely to interpret that comment as pressuring them to accept your answer.

In the best case, comments like these are merely noise, redundant with system-level notifications; in the worst case, they may be perceived as an attempt to pressure someone to do something that is, after all, completely optional.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "author minor edits bumping post",
        DefaultSuspendDays: 0,
        TemplateBody: `You appear to be editing your post to attract attention, rather than to improve it. Periodic cosmetic edits are not constructive and needlessly bump your post, displacing actually active posts that require more community attention. To quote the Help Center [How does editing work?](${parentUrl}/help/editing):

> **Tiny, trivial edits are discouraged**; try to make the post significantly better when you edit, correcting all problems that you observe.

Please only edit your post to correct errors, to include additional insights, or to update the question for changing circumstances. If you continue to only edit it for cosmetic reasons only, we'll have to lock your post from all further edits.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "minor/trivial suggested edits",
        DefaultSuspendDays: 0,
        TemplateBody: `We have noticed that your recent suggested edits are just correcting a typo in the title and haven't handled any of the other problems with a question. Please note that we expect suggested edits to fix all issues with a post, rather than correcting only a single thing. To quote the Help Center [How does editing work?](${parentUrl}/help/editing):

> **Tiny, trivial edits are discouraged**; try to make the post significantly better when you edit, correcting all problems that you observe.

Do keep in mind to clean up all the problems with the post, while you are proposing edits to it. Suggested edits must also be approved by at least two other users prior to being accepted. We therefore ask users to only make edits which make substantial improvements to posts.

Your ability to suggest edits has been revoked for {suspensionDurationDays} days. We encourage you to use this time to review the [relevant guidelines](${parentUrl}/help/editing) about how to edit posts.`
      },
      {
        AnalogousSystemReasonId: "Plagiarism",
        TemplateName: "tag-wiki plagiarism",
        DefaultSuspendDays: 0,
        TemplateBody: `It has come to our attention that your recent suggested tag wiki edits consisted primarily or entirely of text copied from other websites. We prefer not to simply copy content already available elsewhere in lieu of creating something that adds value to this site, and where possible we prefer that content be your own original work.

Please note that we still require full attribution with a link to the external source, and citing the name of the original author if you are quoting an excerpt. You should also make an effort to seek permission before copying content.

Thank you, and we look forward to your contributions in the future.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "gold badge abuse (redupe to add answer)",
        DefaultSuspendDays: 0,
        TemplateBody: `We have noticed you have used your gold badge privilege to reopen a question closed as duplicate, answer it, and immediately close it again.

- <!-- Add examples of question(s) that user have reopened -->

Please note that this is not how you are supposed to use a gold tag badge.

As you may know, gold badges grant the privilege to single-handedly close and reopen questions as duplicates. This is unlocked after reaching a demanding threshold of answer score in a certain tag and number of answers, under the assumption that you can be **trusted to**:

- recognize when a question is a duplicate of another one, and close it accordingly;
- recognize when a question that is already closed as duplicate is not a duplicate, and reopen it accordingly

By reopening a duplicate with your gold badge you are essentially saying: "this question is not a duplicate and was incorrectly closed". You can answer a question that you reopen this way. However if you immediately proceed to re-close it against the same canonical, we must question your original motivations for reopening. In fact, it doesn't look good at all because you are effectively **disallowing answers to that question except yours**, and **going against others' curation efforts to self-serve your contribution**.

There are a few other appropriate actions that we ask you to consider:

- If you think that the question is not a duplicate, just leave it open. You may add links to other Q&As that are related or complement your own answer.

- If you think that the question is a duplicate, then just leave it closed. If you think the asker might have a hard time understanding how the canonical applies to their question, you may leave an explanatory comment.

- If you think that the question is a duplicate but the available canonical has inadequate answers, you either close as duplicate and then post a new answer to the canonical; or you answer this question and close the canonical as duplicate of this question, and this question becomes the new canonical.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "gold badge abuse (reopen when answered)",
        DefaultSuspendDays: 0,
        TemplateBody: `We have noticed you have used your gold badge privilege to reopen a question others have closed as duplicate, when you have a stake in the question.

- <!-- Add examples of question(s) that user have reopened -->

Please note that this is not how you are supposed to use a gold tag badge.

As you may know, gold badges grant the privilege to single-handedly close and reopen questions as duplicates. This is unlocked after reaching a demanding threshold of answer score in a certain tag and number of answers, under the assumption that you can be **trusted to**:

- recognize when a question is a duplicate of another one, and close it accordingly;
- recognize when a question that is already closed as duplicate is not a duplicate, and reopen it accordingly

By reopening a duplicate with your gold badge you are essentially saying: "this question is not a duplicate and was incorrectly closed". However if you had a stake in the question and later you or others have to re-vote to close the question against the same canonical, we must question your original motivations for reopening. In fact, it doesn't look good at all because you are effectively **going against others' curation efforts to self-serve your contribution**.

There are a few other appropriate actions that we ask you to consider:

- If you think that the question is not a duplicate when **you have already answered the question**, we request that you raise a reopen discussion on [Meta](${parentUrl}/questions/ask?tags=discussion+specific-question+duplicate-questions).`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "reset inappropriate username",
        DefaultSuspendDays: 0,
        TemplateBody: `We have received reports that your username may be considered offensive to some members of our community. Our [Code of Conduct](${parentUrl}/conduct) requires that all usernames be appropriate for professional discourse and in keeping with our community standards.

As a result we have reset your username to the default setting. We kindly request that you do not change your username back to the previous one without first consulting with us.

If there has been any misunderstanding regarding the meaning of the username you used, please feel free to reach out to us and provide clarification by responding to this message. Additionally, if you would like to change your username to something else that is appropriate and are experiencing any issues in doing so, please let us know and we will be happy to assist.

Thank you for your understanding and cooperation.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "account sharing",
        DefaultSuspendDays: 0,
        TemplateBody: `Company-owned or accounts shared by multiple users are not permitted as stated in the [Terms of Service](${parentUrl}/legal/terms-of-service/public):

> To access some of the public Network features you will need to **register for an account as an individual** and consent to these Public Network Terms. If you do not consent to these Public Network Terms, ${parentName} reserves the right to refuse, suspend or terminate your access to the public Network.

As this account appears to be in breach of this policy, it will be deleted. You are welcome to register again for an account as an individual user, subject to the Terms of Service.

Should you wish to appeal this decision, you can use the [Contact Us](${parentUrl}/contact) form and explaining your situation to the Community Management Team.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: "ban evasion, multiple accounts",
        DefaultSuspendDays: 0,
        TemplateBody: `It has come to our attention that you have been using multiple accounts to work around system limitations. The extra accounts will be removed together with any unanswered questions. Please refrain from using secondary accounts to circumvent our systems in the future.

All system and moderator-imposed limits/blocks/bans/suspensions/etc. apply to the user, not just a single account. You are not permitted to create one or more new accounts in order to get around such limitations. If you are hitting a limit on one account, then you should act as if you were hitting that limit on each of your accounts.

The most common limitations for people to attempt to evade are the system imposed question and answer bans. When you're getting the message 'We are no longer accepting questions/answers from this account', then you should act as if you are getting that message on all of your accounts and not post additional questions or answers (whichever you're hitting), even if you have an alternate account which is not banned. For more detail about question and answer bans and what you can do to get out of them, please see [What can I do when getting “We are no longer accepting questions/answers from this account”?](https://meta.stackoverflow.com/a/255584#255584)

Having more than one account is permitted, if the additional account is not used to circumvent such limitations and the accounts do not interact with each other, or otherwise allow you to do things which you would not be permitted to do with a single account. If you are interested in more information about having more than one account, please see [What are the rules governing multiple accounts (i.e. sockpuppets)?](https://meta.stackoverflow.com/q/388984).`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: "question repetition, multiple accounts",
        DefaultSuspendDays: 0,
        TemplateBody: `It has been called to our attention that you have asked the same question from multiple accounts. The extra accounts will be removed together with any unanswered questions. Please refrain from using secondary accounts to circumvent our systems in the future.

If your question was closed or did not attract responses, then the first thing to do is to *improve the question*; some guidance for this is [given here](https://stackoverflow.com/help/how-to-ask). Questions that aren’t up to standards are voted on and may be closed: this doesn’t mean they’re gone forever, as they can be reopened if improved or clarified (as appropriate). Please see our [editing](https://stackoverflow.com/editing-help) guidelines for how to improve your question.

However, please do not keep re-asking the same question. If your ability to ask questions has been suspended, do not create new accounts to circumvent our systems; this will result in increasingly longer suspensions being applied. Having more than one account is permitted, if the additional account is not used to circumvent such limitations and the accounts do not interact with each other, or otherwise allow you to do things which you would not be permitted to do with a single account. If you are interested in more information about having more than one account, please see [What are the rules governing multiple accounts (i.e. sockpuppets)?](https://meta.stackoverflow.com/q/388984)`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: 'demands to show effort/"not a code-writing service"',
        DefaultSuspendDays: 0,
        TemplateBody: `It has come to our attention that you've left one or more comments similar to the following:

> Please show some effort. This is not a code-writing service.

[Stack Overflow *is* a code-writing service](https://meta.stackoverflow.com/a/408565), in the sense that it is a programming Q&A site, and most questions here are solved by writing code in the answer. It is [not a debugging helpdesk for askers](https://meta.stackexchange.com/a/364585)&mdash;we do not require that askers provide existing code to debug. Lack of problem-solving effort is not a reason to close or otherwise object to questions. [The only type of effort we require is the effort required to ask a clear, focused, non-duplicate question](https://meta.stackoverflow.com/a/260909). Including an attempt often adds noise and results in answers that are applicable to just the original asker, rather than anyone doing the same thing.  Many of the most useful questions on the site do not include an existing attempt at solving the problem.

Of course, Stack Overflow is *also* not a free application design and development service. Questions may still be closed as too broad (or unclear) if that is the problem. But please do not try to limit the questions asked here to problems with *existing* code. Instead, focus on the scope and clarity of questions. The goal should be to encourage questions that might help the next person with the same problem.

Please do not post any more of these comments. They add noise for moderators to remove, may be perceived as demanding or unfriendly, and don't assist with our goal of creating a knowledge base. Please vote to close questions that you think are off-topic, unclear, or otherwise not appropriate for Stack Overflow.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: "self tag burnination",
        DefaultSuspendDays: 0,
        TemplateBody: `As you should be aware, there is [a process for mass tag removal](https://meta.stackoverflow.com/q/324070), also known as burnination. The [policy from Stack Exchange](https://meta.stackoverflow.com/q/356963) is that the process **must** be followed and that burninations of tags which are used on more than 50 questions **must** be discussed on Meta Stack Overflow *prior* to beginning to edit to remove the tag.

You have recently removed many tags from questions without following the burnination process. Do not do that. This message is a warning. If you do this again, with this or any other tag, then there will be further consequences.

The edits you made will be reverted. Some of the edits have other beneficial changes, which you are welcome to reapply. However, you are not permitted to systematically remove tags from questions without following the burnination process.`
      },
      {
        AnalogousSystemReasonId: "Plagiarism",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: "mass plagiarism",
        DefaultSuspendDays: 0,
        TemplateBody: `It has come to our attention that some of your answers contain text copied from other answers or websites without giving credit to the source of the text.  This is considered plagiarism, and it is a violation of our Terms of Service and the license agreement.

You are not allowed to copy content already available elsewhere and claim it as your own.  That is, you must _at least_ provide [clear attribution](/help/referencing).

**Posts containing content from other sources must:**

  - Include the name of the original author.
  - Include a link to the original source.
  - Make it clear (using [quote formatting](/editing-help#simple-blockquotes)) **which parts of the answer are copied, and from where.** *Just putting a link to the original source somewhere in the post is not enough*, because it does not make it clear that it is the source of the content.  For more information, see [this answer](https://meta.stackoverflow.com/a/321326).
  - Add your own content to the post.  It should not be entirely (or almost entirely) copied content.

Even if you change some of the wording or code a bit, you still must credit the original source.  As a general rule, if it's recognizable when you compare the two side-by-side, it needs to give credit.

Any answers that we found with copied content that did not reference its source have been deleted.  If you wish to review them, you can view the [list of all of your deleted answers](/users/deleted-answers/current) (which may also have answers deleted for other reasons).  If you have other answers that do not properly credit their sources, and you want to avoid them being removed, please edit them to follow the above requirements.

<!-- Remove if not suspending -->

Due to the large number of plagiarized posts (requiring large amounts of volunteer moderator time to check), **your account has been temporarily suspended for {suspensionDurationDays} days.** While you're suspended, your reputation will show as 1 but will be restored once the suspension ends.

<!-- Remove the following if not bulk deleting -->

Due to the large percentage of plagiarized content, we have also opted to delete many of your answers that we were not able to check for copied content in a reasonable amount of time. While there may be some of your answers that were not plagiarized, we simply don't have the time to check every individual answer that you have posted to this site.

If there are specific answers of yours that you believe were not plagiarized (that is, they are your own, original work), and you would like to have these specific answers undeleted, you may reply to this message with a list of such answers, or raise an "In need of moderator intervention" flag on the answers with an explanation. We will verify those individual answers and consider them for undeletion.`
      },
      {
        AnalogousSystemReasonId: "ExcessiveSelfPromotion",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: "promotional content; answers not self-contained",
        DefaultSuspendDays: 0,
        // The \n characters used below are to get around a Tampermonkey default setting which automatically removes trailing whitespace from changed lines.
        TemplateBody: `**Promotional content:**  
We noticed that at least some of your posts seem to promote and/or link to a product, website, blog, library, YouTube channel/videos, project, source code repository, etc. Per the [help center](${parentUrl}/help/behavior):

> Be careful, because the community frowns on overt self-promotion and tends to vote it down and flag it as spam. Post good, relevant answers, and if some (but not all) happen to be about your product or website, so be it. However, you _must_ disclose your affiliation in your answers. Also, if a huge percentage of your posts include a mention of your product or website, you're probably here for the wrong reasons. Our advertising rates are quite reasonable; [contact our ad sales team for details](${parentUrl}/advertising).

You should also review the content at the following links:

- [**What signifies "Good" self promotion?**](https://meta.stackexchange.com/q/182212),
- [some tips and advice about self-promotion](${parentUrl}/help/promotion),
- [What is the exact definition of "spam" for Stack Overflow?](https://meta.stackoverflow.com/q/260638), and
- [What makes something spam](https://meta.stackexchange.com/a/58035).

Any type of "astroturfing" promotion is not acceptable, regardless of if it's for profit or not. It brings down the overall value of genuine content and recommendations for everyone on the site.

If you do include a link to something, then the link needs to be directly relevant to the question and/or answer (i.e. a specific page that is about the issue(s) in the question and/or answer). It should not be just a general link to your site, product, blog, YouTube channel, etc. If the link is to something you are affiliated with, then you _must_ include explicit disclosure of your affiliation in your post, unless the link is to official documentation for a product/library that is explicitly asked about in the question.

**Answers must be a self-contained answer to the question:**  
Your answers need to be actual, complete answers to the question. Just a link to something off-site doesn't make for an answer. [Answers must actually answer the question](https://meta.stackexchange.com/q/225370), without requiring the user to click to some other site to get enough information to solve the problem / answer the question. Please [add context around links](https://meta.stackoverflow.com/a/8259). _[Always quote](${parentUrl}/help/referencing) the most relevant part of an important link, in case the target site is unreachable or goes permanently offline._ If you are linking to a library or framework, then [explain _why_ and _how_ it solves the problem, _and provide code on how to use it_](https://meta.stackoverflow.com/a/251605). Take into account that being _barely more than a link to an external site_ is a reason as to [Why and how are some answers deleted?](${parentUrl}/help/deleted-answers).`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        StackOverflowOnly: true,
        // because template has SO-only meta links
        TemplateName: "ChatGPT banned; plagiarism (AI); inaccurate AI content",
        DefaultSuspendDays: 0,
        TemplateBody: `**Use of ChatGPT for content while its use is banned:**  
The use of ChatGPT as a source for content on ${parentName} is currently banned. Please see the Meta Stack Overflow question "[Temporary policy: ChatGPT is banned](https://meta.stackoverflow.com/q/421831)". It is not permitted for you to use ChatGPT to create content on ${parentName} during this ban.

**Plagiarism / failure to indicate or attribute work that's not your own (AI generated text):**  
We’ve noticed that at least one of your posts contains text for which you are not the author, which includes AI generated text. Current consensus is that AI generated text requires attribution. See "[Is it acceptable to post answers generated by an AI, such as GitHub Copilot?](https://meta.stackoverflow.com/q/412696)" for more information.

As a general rule, posts should be **your** original work, but including a small passage of text from another source can be a great way to support your post. Please note that **we require full attribution** with a citation/link indicating the original source, and make sure that you **clearly distinguish quoted text from text written by you**. For more information, please see [how to reference material written by others](${parentUrl}/help/referencing).

**Posting AI generated content without regard to accuracy:**  
It is our experience that many users who rapidly obtain content which is AI generated and then copy and paste it into answers are not vetting that content for quality. Using AI as a *tool* to *assist* generating good quality content *might be* reasonable.

Using AI, or other tools, to generate a large quantity of answers without regard to if those answers are *correct and actually answer* the question on which they are posted is not acceptable. Relying solely on readers to judge the correctness of the answer, or even that the answer actually answers the question, is not permitted. It brings down the overall quality of the site. It is *harmful* to your fellow users, burdening them with having to wade through a substantial amount of poor answers. It is often harmful to the question authors on whose questions the answers are posted, as the answers often superficially look reasonable, so the question author spends time on trying to understand the answer, thinking that the person who posted it actually knows what they are talking about, when in reality the answer doesn't really answer the question or is substantially incorrect.

The policies for what, if any, use will be acceptable of AI or similar technologies as a *tool* to **assist** *you* creating content, particularly answers, on ${parentName} are currently in flux. The restrictions which were in place prior to the existence of ChatGPT were:

1. *You* confirm that what is posted as an answer *actually answers the question*;
2. *You* have sufficient subject matter expertise in the topic of the question to be able to assure that any answer you post is correct (as if you wrote it); and
3. The content copied from such tools is indicated as not your own work by following the requirements for referencing the work of others in [how to reference material written by others](${parentUrl}/help/referencing), including, but not limited to, that the text which you copy from the AI is indicated as a quote by being in blockquote formatting, and you explicitly attribute the text.

It's expected that whatever is decided upon as the new policy for using such tools will have *at least* the above requirements, if not be even more stringent, perhaps prohibiting the use of such technologies altogether.

**Some, many, or all of your posts have been deleted:**  
Some, many, or all of your posts may have been or will be deleted, because we believe they violate the rules and guidelines mentioned above. If you believe we are in error regarding a specific post, then feel free to raise an "in need of moderator intervention" flag on that post explaining the issue and request the post be reevaluated. You can find links to your deleted posts from your "[deleted questions](${parentUrl}/users/deleted-questions/current)" and your "[deleted answers](${parentUrl}/users/deleted-answers/current)" pages. Links to the above mentioned deleted post pages can be found at the bottom of the respective [questions](${parentUrl}/users/current?tab=questions) and [answers](${parentUrl}/users/current?tab=answers) tabs in your profile.`
      },
      {
        AnalogousSystemReasonId: "OtherViolation",
        TemplateName: "voluntary suspension",
        DefaultSuspensionReason: "upon request",
        TemplateBody: `We have temporarily suspended your account for {suspensionDurationDays} days upon request.

Since this suspension is fully voluntary, you are welcome to reply to this message and request that the suspension be lifted early. Otherwise it will automatically expire in {suspensionDurationDays} days, upon which time your full reputation and privileges will be restored.

We wish you a pleasant vacation from the site, and we look forward to your return!`,
        IncludeSuspensionFooter: false,
        Footer: ""
      }
    ];
    class ModMessageForm {
      blankTemplateOptionValue = "0";
      systemTemplateReasonIds;
      constructor() {
        this.systemTemplateReasonIds = /* @__PURE__ */ new Set([...this.$templateSelector.find("option").map((_, n) => $(n).val())]);
      }
      get $form() {
        return $("#js-msg-form");
      }
      get $messageContents() {
        return $("#js-message-contents");
      }
      get $aboutUserId() {
        return $('.js-about-user-id[name="userId"]');
      }
      get aboutUserId() {
        return Number(this.$aboutUserId.val());
      }
      get $templateSelector() {
        return $("#select-template-menu");
      }
      get reasonId() {
        return this.$templateSelector.val();
      }
      set reasonId(newOptionValue) {
        this.$templateSelector.val(newOptionValue);
      }
      get displayedSelectedTemplate() {
        return this.$templateSelector.find("option:selected").text();
      }
      get $customTemplateNameInput() {
        return $("#usr-template-name-input");
      }
      get customTemplateName() {
        return this.$customTemplateNameInput.val();
      }
      set customTemplateName(newTemplateName) {
        this.$customTemplateNameInput.val(newTemplateName);
      }
      get $suspensionOptions() {
        return $("#suspension-options");
      }
      get $suspensionDays() {
        return $('.js-suspension-days[name="suspendDays"]');
      }
      get suspendDays() {
        return Number(this.$suspensionDays.val());
      }
      get $editor() {
        return $("#wmd-input");
      }
      get editorText() {
        return this.$editor.val();
      }
      set editorText(newText) {
        this.$editor.val(newText);
      }
      refreshEditor() {
        StackExchange.MarkdownEditor.refreshAllPreviews();
      }
      get $autoSuspendMessageField() {
        return $("#js-auto-suspend-message");
      }
      get autoSuspendMessageTemplateText() {
        return this.$autoSuspendMessageField.val();
      }
      set autoSuspendMessageTemplateText(newValue) {
        this.$autoSuspendMessageField.val(newValue);
      }
      isSystemTemplate(reasonId) {
        return this.systemTemplateReasonIds.has(reasonId ?? this.reasonId);
      }
      hasTemplateSelected() {
        return this.reasonId !== this.blankTemplateOptionValue;
      }
      hasCustomTemplateName() {
        return this.displayedSelectedTemplate !== this.customTemplateName;
      }
    }
    const ui = new ModMessageForm();
    function attachTemplateNameInputField() {
      const customTemplateDivHiddenClass = "d-none";
      const $customTemplateDiv = $(`<div class="${customTemplateDivHiddenClass} d-flex gy4 fd-column mb12"></div>`).append('<label class="flex--item s-label">Template Name</label>').append('<input id="usr-template-name-input" class="flex--item s-input wmx4" maxlength="272">');
      ui.$messageContents.before($customTemplateDiv);
      ui.$templateSelector.on("change", (e) => {
        if (!e.target.options[e.target.selectedIndex]) {
          return;
        }
        ui.customTemplateName = e.target.options[e.target.selectedIndex].text;
        if (ui.hasTemplateSelected()) {
          $customTemplateDiv.removeClass(customTemplateDivHiddenClass);
        } else {
          $customTemplateDiv.addClass(customTemplateDivHiddenClass);
        }
      });
      ui.$customTemplateNameInput.on("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          return false;
        }
        return true;
      });
    }
    function createReasonOption(newOptionValue, newOptionText) {
      return $(`<option value="${newOptionValue}">${newOptionText ?? newOptionValue}</option>`);
    }
    function addReasonsToSelect() {
      const isStackOverflow = parentUrl === "https://stackoverflow.com";
      const reasonsToAdd = customModMessages.reduce((acc, message) => {
        if (message?.StackOverflowOnly === true && !isStackOverflow) {
          return acc;
        }
        acc.push(message.TemplateName);
        return acc;
      }, []);
      if (reasonsToAdd.length === 0) {
        return;
      }
      ui.$templateSelector.find(`option[value!="${ui.blankTemplateOptionValue}"]`).wrapAll('<optgroup label="Stock Templates"></optgroup>');
      ui.$templateSelector.append(
        $('<optgroup label="Custom Templates"></optgroup>').append(...reasonsToAdd.map((reasonId) => createReasonOption(reasonId)))
      );
    }
    function checkForURLSearchParams() {
      const reasonIdParam = new URLSearchParams(window.location.search).get("reasonId");
      if (reasonIdParam) {
        ui.reasonId = reasonIdParam;
        ui.$templateSelector.trigger("change");
      }
    }
    function fixAutoSuspendMessagePluralisation() {
      ui.$suspensionOptions.on("change", () => {
        ui.autoSuspendMessageTemplateText = ui.autoSuspendMessageTemplateText.replace(
          /\$days\$ days?/,
          ui.suspendDays === 1 ? "$days$ day" : "$days$ days"
        );
        ui.refreshEditor();
      });
    }
    function setupProxyForNonDefaults() {
      $.ajaxSetup({
        beforeSend: (jqXHR, settings) => {
          if (!settings?.url?.startsWith("/admin/template/")) {
            return;
          }
          const url = new URL(settings.url, location.origin);
          if (!url.searchParams.has("reasonId")) {
            return;
          }
          const reasonId = url.searchParams.get("reasonId");
          if (ui.isSystemTemplate(reasonId)) {
            settings.success = new Proxy(settings.success, {
              apply: (target, thisArg, args) => {
                const [fieldDefaults] = args;
                fieldDefaults.MessageTemplate.Footer = fieldDefaults.MessageTemplate.Footer.replace("Regards,\n\n", "Regards,  \n");
                Reflect.apply(target, thisArg, args);
              }
            });
            return;
          }
          jqXHR.abort();
          const templateSearch = customModMessages.filter((x) => {
            return x.TemplateName.localeCompare(reasonId) === 0;
          });
          if (templateSearch.length !== 1) {
            StackExchange.helpers.showToast("UserScript Message - Template with that name not found!", { type: "danger" });
            return;
          }
          const selectedTemplate = templateSearch[0];
          void $.ajax({
            type: "GET",
            url: url.pathname,
            data: {
              reasonId: selectedTemplate.AnalogousSystemReasonId
            },
            success: function(fieldDefaults) {
              fieldDefaults.MessageTemplate = {
                ...fieldDefaults.MessageTemplate,
                ...selectedTemplate
              };
              settings.success(fieldDefaults, "success", jqXHR);
            },
            error: settings.error
          });
        }
      });
    }
    async function submitFormAndAnnotate(fetchPath, serialisedFormData, userId, annotationText) {
      try {
        assertValidAnnotationTextLength(annotationText.length);
        const response = await fetch(fetchPath, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: serialisedFormData
        });
        if (!response.ok) {
          throw new Error("Failed to send message");
        }
        try {
          await annotateUser(userId, annotationText);
          window.location.href = response.url;
        } catch (error) {
          console.error(error);
          const confirmRefresh = await StackExchange.helpers.showConfirmModal({
            title: "Annotation Failed",
            body: "The message was sent but the profile was not annotated. Refresh anyway?",
            buttonLabel: "Refresh"
          });
          if (confirmRefresh) {
            window.location.href = response.url;
          }
        }
      } catch (error) {
        console.error(error);
        StackExchange.helpers.showToast(
          "Something went wrong, inspect the console for details",
          {
            type: "danger",
            transient: true,
            transientTimeout: 3e3
          }
        );
      }
    }
    function setupSubmitIntercept() {
      ui.$form.on("submit", function(e) {
        if (ui.hasCustomTemplateName()) {
          ui.$templateSelector.append(createReasonOption(ui.customTemplateName));
          ui.reasonId = ui.customTemplateName;
        }
        if (ui.isSystemTemplate() || ui.suspendDays === 0) {
          return true;
        }
        e.preventDefault();
        const text = window.modSuspendTokens(ui.editorText);
        if (!text) {
          StackExchange.helpers.showToast("Please fill out the mod message form", {
            type: "danger"
          });
          return false;
        }
        if (text.match(/\{todo/i) || text.match(/\{suspensionDurationDays/i)) {
          StackExchange.helpers.showToast(
            "It looks like there are incomplete placeholders; please ensure all necessary detail is complete",
            { type: "danger" }
          );
          return false;
        }
        ui.editorText = text;
        ui.reasonId = "OtherViolation";
        const url = new URL("/users/message/save", parentUrl);
        void submitFormAndAnnotate(
          url.pathname,
          $(this).serialize(),
          ui.aboutUserId,
          `${ui.reasonId} (content of previous entry)`
        );
        return false;
      });
    }
    attachTemplateNameInputField();
    addReasonsToSelect();
    checkForURLSearchParams();
    setupProxyForNonDefaults();
    fixAutoSuspendMessagePluralisation();
    setupSubmitIntercept();
  });
})();
