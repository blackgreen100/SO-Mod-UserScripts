import {type ActionEvent} from '@hotwired/stimulus';
import {fetchFullUrlFromUserId, fetchUserIdFromHref} from '../Utilities/UserInfo';
import {annotateUser, type DeleteReason, deleteUser, getUserPii} from '../Utilities/UserModActions';
import {type BaseStacksControllerConfig} from '../Utilities/Types';

const config = {
    ids: {
        modal: 'beadh-modal',
        mainAccountIdInput: 'beadh-main-account-id-input',
        deletionReason: 'beadh-delete-reason',
        deleteReasonDetails: 'beadh-deleteReasonDetails',
        annotationDetails: 'beadh-mod-menu-annotation',
        shouldMessageAfter: 'beadh-message-user-checkbox'
    },
    data: {
        controller: 'ban-evasion-form',
        target: {
            mainAccountIdInput: 'main-account-id',
            mainAccountIdInputButton: 'main-account-id-button',
            formElements: 'form-elements',
            deletionReasonSelect: 'delete-reason',
            deletionDetails: 'delete-reason-detail-text',
            annotationDetails: 'annotation-detail-text',
            shouldMessageAfter: 'message-user-checkbox',
            controllerSubmitButton: 'submit-actions-button'
        },
        action: {
            lookupMainAccountId: 'lookupMain',
            handleSubmitActions: 'handleSubmitActions',
            handleCancelActions: 'handleCancelActions'
        }
    },
    validationBounds: {
        deleteReasonDetails: {
            min: 15,
            max: 600
        },
        annotationDetails: {
            min: 10,
            max: 300
        },

    },
    supportedDeleteOptions: {
        'Ban evasion': 'This user was created to circumvent system or moderator imposed restrictions and continues to contribute poorly',
        'No longer welcome': 'This user is no longer welcome to participate on the site'
    }
};

/*** User Actions ***/

function getUserIdFromAccountInfoURL(): number {
    const userId = fetchUserIdFromHref(window.location.pathname);
    if (userId === undefined) {
        const message = 'Could not get Sock Id from URL';
        StackExchange.helpers.showToast(message, {transientTimeout: 3000, type: 'danger'});
        throw Error(message);
    }
    return userId;
}

function handleDeleteUser(userId: number, deletionReason: DeleteReason, deletionDetails: string) {
    return deleteUser(
        userId,
        deletionReason,
        deletionDetails
    )
        .then(res => {
            if (res.status !== 200) {
                const message = `Deletion on ${userId} unsuccessful.`;
                StackExchange.helpers.showToast(message, {transient: false, type: 'danger'});
                console.error(res);
                throw Error(message);
            }
        });
}

function handleAnnotateUser(userId: number, annotationDetails: string) {
    return annotateUser(userId, annotationDetails)
        .then(res => {
            if (res.status !== 200) {
                const message = `Annotation on ${userId} unsuccessful.`;
                StackExchange.helpers.showToast(message, {transient: false, type: 'danger'});
                console.error(res);
                throw Error(message);
            }
        });
}

function handleDeleteAndAnnotateUsers(
    sockAccountId: number,
    deletionReason: DeleteReason,
    deletionDetails: string,
    mainAccountId: number,
    annotationDetails: string
) {
    return handleDeleteUser(sockAccountId, deletionReason, deletionDetails)
        .then(() => handleAnnotateUser(mainAccountId, annotationDetails));
}

/*** Build Base Modal (Only includes the first part of the form) ***/

function createModal() {
    // Build Modal
    return $(`<aside class="s-modal s-modal__danger" id="${config.ids.modal}" tabindex="-1" role="dialog" aria-labelledby="${config.ids.modal}-title" aria-describedby="${config.ids.modal}-description" aria-hidden="false" data-controller="s-modal" data-s-modal-target="modal">
    <div class="s-modal--dialog" role="document" data-controller="${config.data.controller}">
        <h1 class="s-modal--header" id="${config.ids.modal}-title">Delete Ban Evasion Account</h1>
        <div class="s-modal--body" id="${config.ids.modal}-description">
            <div class="d-flex fd-column g12 mx8" data-${config.data.controller}-target="${config.data.target.formElements}">
                <div class="d-flex fd-row g4 jc-space-between ai-center">
                    <label class="s-label" for="${config.ids.mainAccountIdInput}" style="min-width:fit-content;">Enter Id For Main Account: </label>
                    <input data-${config.data.controller}-target="${config.data.target.mainAccountIdInput}" class="s-input" type="number" id="${config.ids.mainAccountIdInput}">
                    <button data-${config.data.controller}-target="${config.data.target.mainAccountIdInputButton}" class="s-btn s-btn__primary" type="button" style="min-width:max-content;" data-action="${config.data.controller}#${config.data.action.lookupMainAccountId}">Resolve User URL</button>
                </div>
            </div>
        </div>
        <div class="d-flex gx8 s-modal--footer">
            <button class="s-btn flex--item s-btn__filled s-btn__danger" type="button" data-${config.data.controller}-target="${config.data.target.controllerSubmitButton}" data-action="click->${config.data.controller}#${config.data.action.handleSubmitActions}" disabled>Delete and Annotate</button>
            <button class="s-btn flex--item s-btn__muted" type="button" data-action="click->${config.data.controller}#${config.data.action.handleCancelActions}">Cancel</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" type="button" aria-label="Close" data-action="s-modal#hide"><svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg></button>
    </div>
</aside>`);
}

/*** Helper Functions for Stacks Controller ***/

function buildDetailStringFromObject(obj: Record<string, string>, keyValueSeparator: string, recordSeparator: string, alignColumns = false) {
    const filteredObj = Object.entries(obj)
        .reduce((acc, [key, value]) => {
            if (value.length > 0) {
                acc[`${key}${keyValueSeparator}`] = value;
            }
            return acc;
        }, {} as Record<string, string>);

    const getPaddingStr = (function () {
        if (alignColumns) {
            const maxLabelLength = Math.max(...Object.keys(filteredObj).map(k => k.length));
            return function (key: string) {
                return new Array(maxLabelLength - key.length + 1).join(' ');
            };
        } else {
            return function (_: unknown) {
                return '';
            };
        }
    }());

    return Object.entries(filteredObj)
        .map(([key, value]) => `${key}${getPaddingStr(key)}${value}`)
        .join(recordSeparator);

}

interface ValidationBounds {
    min: number;
    max: number;
}

function validateLength(label: string, s: string, bounds: ValidationBounds) {
    if (s.length < bounds.min || s.length > bounds.max) {
        const message = `${label} has ${s.length} characters which is outside the supported bounds of ${bounds.min} to ${bounds.max}`;
        StackExchange.helpers.showToast(
            message,
            {
                transientTimeout: 3000,
                type: 'danger'
            }
        );
        throw Error(message);
    }
}

function getTargetPropKey(s: string) {
    return `${s}Target`;
}

/*** Stacks Controller Configuration ***/
interface BanEvasionControllerValues {
    sockAccountId: number;
    mainAccountId: number;
    deletionReason: DeleteReason;
    deletionDetails: string;
    annotationDetails: string;
    shouldMessageAfter: boolean;
}

interface BanEvasionControllerHelperFunctions {
    validateFields: () => void;
    buildRemainingFormElements: () => Promise<void>;
}

type BanEvasionControllerType =
    BaseStacksControllerConfig
    & BanEvasionControllerValues
    & BanEvasionControllerHelperFunctions /*
    & {[actionEventHandler: string]: (ev:ActionEvent) => void}
    & {[htmlTargetKey: string]: HTMLElement}
    */;


function createModalAndAddController() {
    const banEvasionControllerConfiguration: BanEvasionControllerType = {
        targets: [
            ...Object.values(config.data.target) // Establishes access to all targets
        ],
        initialize() {
            this.sockAccountId = getUserIdFromAccountInfoURL();
        },
        sockAccountId: undefined, // Needs to be defined for typing reasons
        get mainAccountId() {
            return Number(this[getTargetPropKey(config.data.target.mainAccountIdInput)].value);
        },
        get deletionReason() {
            return this[getTargetPropKey(config.data.target.deletionReasonSelect)].value;
        },
        get deletionDetails() {
            return this[getTargetPropKey(config.data.target.deletionDetails)].value;
        },
        get annotationDetails() {
            return this[getTargetPropKey(config.data.target.annotationDetails)].value;
        },
        get shouldMessageAfter() {
            return (<HTMLInputElement>this[getTargetPropKey(config.data.target.shouldMessageAfter)]).checked;
        },
        validateFields() {
            validateLength('Deletion reason details', this.deletionDetails, config.validationBounds.deleteReasonDetails);
            validateLength('Annotation details', this.annotationDetails, config.validationBounds.annotationDetails);
        },
        [config.data.action.handleSubmitActions](ev: ActionEvent) {
            ev.preventDefault();
            this.validateFields(); // validate before confirming (it's more annoying to confirm, then get a message that the field needs fixed)
            void StackExchange.helpers.showConfirmModal({
                title: 'Are you sure you want to delete this account?',
                body: 'You will be deleting this account and placing an annotation on the main. This operation cannot be undone.',
                buttonLabelHtml: 'I\'m sure'
            })
                .then(actionConfirmed => {
                    if (!actionConfirmed) {
                        return;
                    }

                    handleDeleteAndAnnotateUsers(this.sockAccountId, this.deletionReason, this.deletionDetails, this.mainAccountId, this.annotationDetails)
                        .then(() => {
                            if (this.shouldMessageAfter) {
                                // Open new tab to send message to main account
                                window.open(`/users/message/create/${this.mainAccountId}`, '_blank');
                            }
                            // Reload current page if delete and annotation is successful
                            // window.location.reload();
                        })
                        .catch(err => {
                            console.error(err);
                        });
                });
        },
        [config.data.action.handleCancelActions](ev: ActionEvent) {
            ev.preventDefault();
            // Clear from DOM which will force click to rebuild and recreate controller
            document.getElementById(config.ids.modal).remove();
        },
        [config.data.action.lookupMainAccountId](ev: ActionEvent) {
            ev.preventDefault();
            if (this.mainAccountId === this.sockAccountId) {
                StackExchange.helpers.showToast('Cannot enter current account ID in parent field.', {
                    type: 'danger',
                    transientTimeout: 3000
                });
                return;
            }

            // Disable so that no changes are made with this information after the fact (a refresh is required to fix this)
            this[getTargetPropKey(config.data.target.mainAccountIdInput)].disabled = true;
            this[getTargetPropKey(config.data.target.mainAccountIdInputButton)].disabled = true;

            void this.buildRemainingFormElements();
        },
        async buildRemainingFormElements() {
            const [mainUrl, sockUrl, {email: sockEmail, name: sockRealName}] = await Promise.all([
                fetchFullUrlFromUserId(this.mainAccountId),
                fetchFullUrlFromUserId(this.sockAccountId),
                getUserPii(this.sockAccountId)
            ]);

            $(this[getTargetPropKey(config.data.target.formElements)]).append(
                $(`<div class="d-flex fd-row g6">
                <label class="s-label">Main account located here:</label>
                <a href="${mainUrl}" target="_blank">${mainUrl}</a>
            </div>
            <div class="d-flex gy4 fd-column">
                <label class="s-label" for="${config.ids.deletionReason}">Reason for deleting this user:</label>
                <div class="flex--item s-select">
                    <select id="${config.ids.deletionReason}" data-${config.data.controller}-target="${config.data.target.deletionReasonSelect}">
                        <option value="This user was created to circumvent system or moderator imposed restrictions and continues to contribute poorly">Ban evasion</option>
                        <option value="This user is no longer welcome to participate on the site">No longer welcome</option>
                    </select>
                </div>
            </div>
            <div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="15" data-se-char-counter-max="600">
                <label class="s-label flex--item" for="${config.ids.deleteReasonDetails}">Please provide details leading to the deletion of this account (required):</label>
                <textarea style="font-family:monospace" 
                          class="flex--item s-textarea" 
                          data-se-char-counter-target="field" 
                          data-is-valid-length="false"
                          id="${config.ids.deleteReasonDetails}" 
                          name="deleteReasonDetails" 
                          placeholder="Please provide at least a brief explanation of what this user has done; this will be logged with the action and may need to be referenced later." 
                          rows="6" 
                          data-${config.data.controller}-target="${config.data.target.deletionDetails}"></textarea>
                <div data-se-char-counter-target="output" class="cool"></div>
            </div>
            <div class="d-flex ff-column-nowrap gs4 gsy" data-controller="se-char-counter" data-se-char-counter-min="10" data-se-char-counter-max="300">
                <label class="s-label flex--item" for="${config.ids.annotationDetails}">Annotate the main account (required): </label>
                <textarea style="font-family:monospace" 
                          class="flex--item s-textarea" 
                          data-se-char-counter-target="field" 
                          data-is-valid-length="false" 
                          id="${config.ids.annotationDetails}" 
                          name="annotation" 
                          placeholder="Examples: &amp;quot;possible sock of /users/XXXX, see mod room [link] for discussion&amp;quot; or &amp;quot;left a series of abusive comments, suspend on next occurrence&amp;quot;" 
                          rows="4" 
                          data-${config.data.controller}-target="${config.data.target.annotationDetails}"></textarea>
                <div data-se-char-counter-target="output" class="cool"></div>
            </div>
            <div class="d-flex fd-row">
                <div class="s-check-control">
                    <input class="s-checkbox" 
                           type="checkbox" 
                           id="${config.ids.shouldMessageAfter}" 
                           checked 
                           data-${config.data.controller}-target="${config.data.target.shouldMessageAfter}">
                    <label class="s-label" for="${config.ids.shouldMessageAfter}">Open message user in new tab</label>
                </div>
            </div>`)
            );
            // Set these string values directly (the
            this[getTargetPropKey(config.data.target.deletionDetails)].value = `\n\n${buildDetailStringFromObject({
                'Main Account': mainUrl,
                'Email': sockEmail,
                'Real name': sockRealName
            }, ':  ', '\n', true)}`;

            this[getTargetPropKey(config.data.target.annotationDetails)].value = buildDetailStringFromObject({
                'Deleted evasion account': sockUrl,
                'Email': sockEmail,
                'Real name': sockRealName
            }, ': ', ' | ');
            // Enable form submit button now that the fields are active
            this[getTargetPropKey(config.data.target.controllerSubmitButton)].disabled = false;
        },
    };
    $('body').append(createModal());
    Stacks.addController(config.data.controller, banEvasionControllerConfiguration);
}


/*** Create and connect open modal link ***/
function handleBanEvasionButtonClick(ev: JQuery.Event) {
    ev.preventDefault();
    const modal = document.getElementById(config.ids.modal);
    if (modal !== null) {
        Stacks.showModal(modal);
    } else {
        createModalAndAddController();
    }
}

function main() {
    // Adds link to list of mod actions in Dashboard
    const link = $('<a href="#" role="button">delete ban evasion account</a>');
    link.on('click', handleBanEvasionButtonClick);
    $('.list.list-reset.mod-actions li:eq(3)')
        .after(
            $('<li></li>')
                .append(link)
        );
}

StackExchange.ready(main);