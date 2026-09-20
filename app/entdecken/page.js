import WorkspaceApp from '../modules/workspace/WorkspaceAppCurrent'

export const metadata={title:'ASH kennenlernen | ASH Workspace Gold'}

// A permanent public entry. Existing sign-in state never hides the explanation.
export default function Page(){return <WorkspaceApp publicOnly/>}
