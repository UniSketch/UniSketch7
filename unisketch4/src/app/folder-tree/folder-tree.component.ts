import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeModel, TreeNode} from 'angular-tree-component';

import {FolderService} from '../services/folder.service';
import {Folder} from "../models/folder.model";
import {FolderTreeModalComponent} from "../folder-tree-modal/folder-tree-modal.component";
import {DashboardService} from "../services/dashboard.service";
import {NotificationService} from "../services/notification.service";


@Component({
    selector: 'app-folder-tree',
    templateUrl: './folder-tree.component.html',
    styleUrls: ['./folder-tree.component.scss'],
    encapsulation: ViewEncapsulation.None,
})

export class FolderTreeComponent implements OnInit {
    contextMenu: { node: TreeNode, x: number, y: number } = null;
    sourceNode: TreeNode = null;
    editNode: TreeNode = null;
    preEditSave: string = null;
    doCut = false;
    contextmenu = false;
    folders: Folder[];

    @ViewChild(TreeComponent)
    public tree: TreeComponent;

    @ViewChild(FolderTreeModalComponent)
    private modalRef: FolderTreeModalComponent;


    constructor(private folderService: FolderService, private dashboardService: DashboardService, private notificationService: NotificationService) {
        this.folders = [];
    }

    options: ITreeOptions = {
        allowDrag: (node) => true,
        allowDrop: (element, {parent, index}) => {
            return parent.data.name;
        },
        actionMapping: {
            mouse: {
                contextMenu: (treeModel: TreeModel, treeNode: TreeNode, e: MouseEvent) => {
                    e.preventDefault();

                    if (treeNode.id === treeModel.getFirstRoot().id || this.contextMenu && treeNode === this.contextMenu.node) {
                        return this.closeMenu();
                    }


                    this.contextMenu = {
                        node: treeNode,
                        x: e.pageX,
                        y: e.pageY
                    };

                    if (treeModel.getActiveNode()) {
                        if (treeNode.id !== treeModel.getActiveNode().id) {
                            TREE_ACTIONS.TOGGLE_ACTIVE(treeModel, treeNode, e);
                        }
                    } else {
                        TREE_ACTIONS.TOGGLE_ACTIVE(treeModel, treeNode, e);
                    }
                },
                click: (treeModel: TreeModel, treeNode: TreeNode, e: MouseEvent) => {

                    this.closeMenu();
                    TREE_ACTIONS.TOGGLE_ACTIVE(treeModel, treeNode, e);
                },
                drop: (treeModel: TreeModel, treeNode: TreeNode, event, {from, to}) => {
                    if (from instanceof TreeNode) {
                        TREE_ACTIONS.MOVE_NODE(treeModel, treeNode, event, {from, to});
                    } else if (from.title) {

                        this.dashboardService.moveSketch(from, to.parent.data.id)
                            .then((sketchId: number) => {
                                this.dashboardService.getAllSketches();
                            });
                    }
                }
            }
        }
    };

    ngOnInit() {

        this.folderService.getAllFolders()
            .then((folders: Folder[]) => {
                /*folders.forEach((folder: Folder) => {
                    if(folder.children.length > 0) {
                        folder.name += ` (${folder.children.length})`
                    }
                });*/
                this.folders[0] = {
                    id: -1,
                    name: 'Home',
                    children: folders,
                } as Folder;
                this.tree.treeModel.update();            
                if(this.getFolderIDByCookie()==-1||isNaN(this.getFolderIDByCookie())){
                    const firstNode: TreeNode = this.tree.treeModel.getFirstRoot();
                    firstNode.setActiveAndVisible();
                    //this.tree.treeModel.expandAll();
                }
                if(this.getFolderIDByCookie()!==-1){
                    const otherNode: TreeNode = this.tree.treeModel.getNodeById(this.getFolderIDByCookie())
                    otherNode.setActiveAndVisible();
                }
                  
                
                
                
            
                
                
                
            })
            .catch(err => {
                // todo proper error showing
                console.error(err);
            });
    }

    get selectedFolder() {
        
        const node = this.tree.treeModel.getActiveNode();
        if (node) {
            return node.data;
        }
        return {} as Folder;
    }

    get nodes() {
        return this.folders;
    }


    closeMenu() {
        this.contextMenu = null;
    }

    leave(event) {
        this.closeMenu()
    }

    editFolderName() {
        this.editNode = this.contextMenu.node;
        this.preEditSave = this.contextMenu.node.data.name;
        this.closeMenu();
    }


    stopEdit(event) {
        if (this.editNode.data.name.length <= 1) {
            this.editNode.data.name = this.preEditSave;
            this.editNode = null;
            this.preEditSave = null;
            this.notificationService.create('The folder could not be renamed, because the folder name has to be at least 2 characters long.', 'warning');
            return;
        }

        this.folderService.renameFolder(this.editNode.data, event.target.value)
            .then((folder: Folder) => {

            })
            .catch(err => {
                console.log(err)
            });
        this.editNode = null;
    }

    openNewFolderModal(event) {
        this.modalRef.show();
        this.closeMenu();
    }

    deleteFolder(event) {
        if (this.hasSelectedFolder()) {
            this.folderService.deleteFolder(this.selectedFolder)
                .then((id: number) => {
                    this.removeFolder(id);
                    this.tree.treeModel.update();
                    this.closeMenu();
                })
                .catch(err => {
                    console.log(err);
                })
        }
    }

    addFolder(folder: Folder) {

        if (this.hasSelectedFolder()) {
            const node: TreeNode = this.tree.treeModel.getNodeById(this.selectedFolder.id);
            if (node.level < 4) {
                if (!this.selectedFolder.children) {
                    this.selectedFolder.children = [];
                }
                this.selectedFolder.children.push(folder);
            } else {
                this.notificationService.create('The sub-folder limit is reached and the folder could not be added.', 'warning');
            }
        } else {
            this.folders[0].children.push(folder);
        }
        // TODO theoretically the folders could be sorted alphabetically at this point.
        this.tree.treeModel.update();
        this.tree.treeModel.expandAll();
    }

    copy() {
        this.sourceNode = this.contextMenu.node;
        this.doCut = false;
        this.closeMenu();
    }

    cut() {
        this.sourceNode = this.contextMenu.node;
        this.doCut = true;
        this.closeMenu();
    }

    paste() {
        if (!this.canPaste()) {
            return;
        }
        this.doCut
            ? this.sourceNode.treeModel.moveNode(this.sourceNode, {parent: this.contextMenu.node, index: 0})
            : this.sourceNode.treeModel.copyNode(this.sourceNode, {parent: this.contextMenu.node, index: 0});

        this.sourceNode = null;
        this.closeMenu();
    }

    canPaste() {
        if (!this.sourceNode) {
            return false;
        }
        return this.sourceNode.treeModel.canMoveNode(this.sourceNode, {parent: this.contextMenu.node, index: 0});
    }


    onStateChange(event) {
        this.onFolderChange();

        this.dashboardService.getAllSketches()
            .catch(err => {
                console.log(err);
            });
    }

    onMoveNode(event) {
        this.folderService.moveFolder(event.node as Folder, event.to.parent as Folder)
            .then((res) => {
            })
            .catch(err => {
                console.log(err);
            });

    }

    private onFolderChange() {
        if (this.tree.treeModel.getActiveNode()) {
            this.dashboardService.setSelectedFolder(this.tree.treeModel.getActiveNode().data.id);
            this.setCookie("FolderCookie", this.tree.treeModel.getActiveNode().data.id);
        } else {
            this.dashboardService.setSelectedFolder(-1);
            this.setCookie("FolderCookie", this.tree.treeModel.getActiveNode().data.id);           
        }
    }

    public removeFolder(id: number, moveChildren: boolean = true) {
        // the folder has to be a children folder.
        for (let i = 0; i < this.folders.length; i++) {

            if (this.folders[i].id === id) {
                // add children to the root view and remove this
                if (moveChildren && this.folders[i].children) {

                    this.folders[i].children.forEach((child: Folder) => {
                        this.folders.push(child);
                    });
                }
                this.folders.splice(i, 1);
                return;
            }

            if (this.folders[i].children.length > 0) {

                // foreach children of the first level
                for (let j = 0; j < this.folders[i].children.length; j++) {
                    if (this.folders[i].children[j].id === id) {
                        //move the children to a level above
                        if (moveChildren && this.folders[i].children[j].children) {
                            this.folders[i].children[j].children.forEach((child: Folder) => {
                                this.folders[i].children.push(child);
                            });
                        }
                        this.folders[i].children.splice(j, 1);
                        return;
                    }
                    // foreach children of the second level
                    for (let k = 0; k < this.folders[i].children[j].children.length; k++) {
                        if (this.folders[i].children[j].children[k].id === id) {
                            //move the children to a level above
                            if (moveChildren && this.folders[i].children[j].children[k].children) {
                                this.folders[i].children[j].children[k].children.forEach((child: Folder) => {
                                    this.folders[i].children[j].children.push(child);
                                });
                            }

                            this.folders[i].children[j].children.splice(k, 1);
                            return;
                        }
                    }
                }
            }
        }

    }



    private setCookie(name: string, val: number) {
        const date = new Date();
        const value = val;    
        date.setTime(date.getTime() + (7 * 24 * 60 * 60 * 1000));
        document.cookie = name+"="+value+"; expires="+date.toUTCString()+"; path=/";
    }

    private getCookie(name: string) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
    
        if (parts.length == 2) {
            return parts.pop().split(";").shift();
        }
    }


    
    private getFolderIDByCookie(): number {
        if (this.getCookie('FolderCookie') !== '') {
            return Number.parseInt(this.getCookie('FolderCookie'));
        }
        return 0;
    }



    private hasSelectedFolder() {
        return Object.keys(this.selectedFolder).length !== 0;
    }

    private blur(event) {
        if (event.code === 'Enter') {
            event.target.blur();
        }
    }

    private deepFindFolder(data: Folder[], id: number) {
        return data.some((folder: Folder) => {
            if (folder.id === id) return true;
            else if (folder.children) return this.deepFindFolder(folder.children, id);
        });
    }
}
