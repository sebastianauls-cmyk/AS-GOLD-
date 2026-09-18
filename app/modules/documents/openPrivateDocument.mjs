// Reserve the tab during the tap; opening it after the signed-URL request is
// blocked by mobile browsers. A blocked tab gets a normal, explicit fallback link.
export async function openPrivateDocument({browser, getSignedUrl}) {
  let tab = null
  try {
    tab = browser.open('about:blank', '_blank')
    if (tab) tab.opener = null
    const {data, error} = await getSignedUrl()
    if (error || !data?.signedUrl) throw error || new Error('File URL unavailable')
    if (tab && !tab.closed) {
      tab.location.replace(data.signedUrl)
      return {opened: true, url: ''}
    }
    return {opened: false, url: data.signedUrl}
  } catch (error) {
    if (tab && !tab.closed) tab.close()
    throw error
  }
}
