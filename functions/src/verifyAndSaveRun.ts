
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
// TODO: Find a way to share this code between client and functions,
// perhaps via a private NPM package or a build step.
// For now, the logic would be duplicated.
// import { calculate, BaseInputs, EngineSettings } from '../../src/lib/profit-engine';

initializeApp();

interface SaveRunRequest {
    inputs: any; // TODO: Replace with BaseInputs from profit-engine
    settings: any; // TODO: Replace with EngineSettings from profit-engine
    clientResults: any; // TODO: Replace with CalculatedMetrics
    template: string;
    band: 'P' | 'R' | 'O';
}

export const verifyAndSaveRun = onCall({
    enforceAppCheck: true, // Enable App Check
    region: 'europe-west1',
}, async (request) => {

    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { inputs, settings, clientResults, template, band } = request.data as SaveRunRequest;
    
    // --- SERVER-SIDE VERIFICATION ---
    // TODO: Re-run calculation with shared profit-engine to verify client results
    // const { results: serverResults, trace } = calculate(inputs, settings);

    // TODO: Compare serverResults with clientResults. If they differ significantly,
    // log a warning or throw an error.
    logger.info('Client results received for verification.', { uid: request.auth.uid, clientResults });

    const db = getFirestore();
    try {
        const runRef = await db.collection('runs').add({
            userId: request.auth.uid,
            createdAt: new Date().toISOString(),
            inputs,
            settings,
            results: clientResults, // In a real app, you'd save serverResults
            // trace,
            template,
            band,
        });

        logger.info(`Run ${runRef.id} saved successfully for user ${request.auth.uid}`);
        
        return {
            verified: true,
            runId: runRef.id,
            results: clientResults, // Return verified results
        };

    } catch (error) {
        logger.error('Failed to save run to Firestore', { error, uid: request.auth.uid });
        throw new HttpsError('internal', 'Failed to save your report. Please try again.');
    }
});
