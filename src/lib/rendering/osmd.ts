import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

export const createOsmd = (container: HTMLElement): OpenSheetMusicDisplay => {
  return new OpenSheetMusicDisplay(container, {
    autoResize: true,
    drawTitle: true,
    backend: "svg"
  });
};
