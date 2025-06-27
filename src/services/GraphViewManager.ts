import { getPathFromFolder, hexToDecimalRGB, isFolderLink } from 'src/util';
import FolderService from './FolderService';
import { IFileExplorerPlugin, IGraphView } from 'src/types';

export class GraphViewManager {
    private instances: Set<IGraphView> = new Set();

    constructor(private folderService: FolderService, private fileExplorer: IFileExplorerPlugin) {
        this.update();
    }

    addInstance(graphView: IGraphView) {
        if (!graphView.view.dataEngine?.renderer) {
            return;
        }

        this.instances.add(graphView);
        this.updateInstance(graphView);
    }

    removeInstance(graphView: IGraphView) {
        this.instances.delete(graphView);
    }

    update() {
        this.instances.forEach((graphView) => {
            this.updateInstance(graphView);
        });
    }

    updateInstance(graphView: IGraphView) {
        if (!graphView.view.dataEngine?.renderer) {
            return;
        }
        const onNodeClick = graphView.view.dataEngine.renderer.onNodeClick;
        graphView.view.dataEngine.renderer.onNodeClick = (event, path) => {
            if (isFolderLink(path)) {
                const element = graphView!.view.dataEngine.renderer.nodes.filter(
                    (node) => node.id === path
                )[0];
                if (element._folderLink) {
                    this.fileExplorer.view.revealInFolder(element._folderLink);
                } else {
                    this.folderService.createFolder(path);
                }
            } else {
                onNodeClick(event, path);
            }
        };

        const graphNodeColor = getComputedStyle(document.body)
            .getPropertyValue('--graph-node')
            .trim();
        const nodes = Object.keys(graphView.view.dataEngine.renderer.nodeLookup);

        for (const node of nodes) {
            if (isFolderLink(node)) {
                const existingFolder = this.folderService.currentValue.raw.filter(
                    (f) => f.path === getPathFromFolder(node)
                )[0];

                if (existingFolder) {
                    graphView.view.dataEngine.renderer.nodeLookup[node]._folderLink =
                        existingFolder;

                    const element = graphView.view.dataEngine.renderer.nodeLookup[node];
                    const renderer = graphView.view.renderer;

                    graphView.view.dataEngine.renderer.nodeLookup[node].getFillColor = () => {
                        if (
                            element.type === 'unresolved' &&
                            renderer?.getHighlightNode()?.id != element.id
                        ) {
                            return { a: 1, rgb: hexToDecimalRGB(graphNodeColor).decimal };
                        } else {
                            return element.__proto__.getFillColor.call(element);
                        }
                    };
                } else {
                    graphView.view.dataEngine.renderer.nodeLookup[node].getFillColor =
                        graphView.view.dataEngine.renderer.nodeLookup[node].__proto__.getFillColor;
                    graphView.view.dataEngine.renderer.nodeLookup[node]._folderLink = null;
                }
                // trigger rerender
                graphView.onResize();
            }
        }
    }
}
