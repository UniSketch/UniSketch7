/**
 * Model describing a participant of a sketch and their role.
 */
export class Participant {
    /**
     * The id of the participant user.
     */
    public user_id: number;

    /**
     * The name of the participant user.
     */
    public name: String;

    /**
     * The email address of the participant user.
     */
    public email_address: String;

    /**
     * The role of the participant.
     */
//    public role: number = 2; // default value for role "editor"
    public role: number = 1;//make default value to 1 because now in frontend the role "viewer" is the default value in dropdownbox
}
