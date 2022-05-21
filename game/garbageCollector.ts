import {scene} from "../game";
import {challengeRows, environmentBits} from "./objects";

export const garbageCollector = () => {
    let environmentObjectsForCollection = environmentBits.filter(x => x.position.z > 100);
    let challengeRowsForCollection = challengeRows.filter(x => x.rowParent.position.z > 100);

    // if (environmentObjectsForCollection.length){
    for (let i = 0; i < environmentObjectsForCollection.length - 1; i++) {
        let environmentObjectIndex = environmentBits.indexOf(environmentObjectsForCollection[i]);
        scene.remove(environmentBits[environmentObjectIndex]);
        environmentBits.splice(environmentObjectIndex, 1);

    }

    for (let i = 0; i < challengeRowsForCollection.length - 1; i++) {
        // debugger;
        let challengeRowIndex = challengeRows.indexOf(challengeRowsForCollection[i]);
        scene.remove(challengeRowsForCollection[i].rowParent);
        // challengeRowsForCollection[i].rowParent.remove();
        // challengeRowsForCollection[i].rowObjects.forEach(x => {
        //     scene.remove(x);
        // });
        challengeRows.splice(challengeRowIndex, 1);

    }
}
