/**
 * This namespace contains helper function to check a user role for permissions on a sketch.
 */
import {Right} from "../models/Right";

export namespace RightsHelper {

    export const ROLE_VIEWER = 1;
    export const ROLE_EDITOR = 2;
    export const ROLE_OWNER = 3;

    function getRoleId(right: Right | null): number {
        if (!right) {
            return 0;
        }

        return right.role_id;
    }

	/**
	 * Returns true if the rights instance is at least an owner.
	 */
    export function isOwner(right: Right | null): boolean {
        return getRoleId(right) == ROLE_OWNER;
    }

	/**
	 * Returns true if the rights instance is at least an editor.
	 */
    export function isEditor(right: Right | null): boolean {
        return getRoleId(right) == ROLE_OWNER || getRoleId(right) == ROLE_EDITOR;
    }

	/**
	 * Returns true if the rights instance is allowed to view a sketch.
	 */
    export function canAccessSketch(right: Right | null): boolean {
        return getRoleId(right) != 0;
    }

    // !!!new!!! for chat - returns true if a user can access the sketch
    export function canRoleIdAccessSketch(role: number): boolean {
        return role == ROLE_EDITOR || role == ROLE_OWNER || role == ROLE_VIEWER;
    }

  /**
	 * Returns true if the rights instance is allowed to manage rights.
	 */
    export function canManageRights(right: Right | null): boolean {
        return canRoleManageRights(getRoleId(right));
    }

	/**
	 * Returns true if the rights instance is allowed to draw in a sketch.
	 */
    export function isAllowedToDraw(right: Right | null): boolean {
        return isRoleAllowedToDraw(getRoleId(right));
    }

	/**
	 * Returns true if the role id is allowed to rename a sketch (editor or owner only).
	 */
    export function isRoleAllowedToChangeSketchMeta(role: number): boolean {
        return role == ROLE_EDITOR || role == ROLE_OWNER;
    }

	/**
	 * Returns true if the role id is allowed to draw in a sketch (editor or owner only).
	 */
    export function isRoleAllowedToDraw(role: number): boolean {
        return role == ROLE_EDITOR || role == ROLE_OWNER;
    }

	/**
	 * Returns true if the role id is allowed to manage rights (owner only).
	 */
    export function canRoleManageRights(role: number): boolean {
        return role == ROLE_OWNER;
    }

}
