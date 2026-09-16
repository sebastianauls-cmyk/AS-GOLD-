export const EXPLAINER_VIDEO_LANGUAGES=Object.freeze(['de','en','fr','tr','pl','ru','ar','fa','ro','bg','vi'])

export const VIDEO_PRESENTER_STORAGE_KEY='ash-workspace-gold-video-presenter'
export const LEGACY_VIDEO_PRESENTER_STORAGE_KEY='asgold-video-presenter'

const translatedVideo=(id)=>`https://resource2.heygen.ai/video_translate/${id}/original.mp4`
const localCaption=(presenter,language,version=133)=>`/captions/ash-workspace-gold-v${version}-${presenter}-${language}.vtt`

export const explainerVideoCatalog=Object.freeze({
  female:Object.freeze({
    de:Object.freeze({src:'/videos/ash-workspace-gold-v134-female-de.mp4',captions:localCaption('female','de',134),heygenId:'60c1b4548c3a0492d8e8dae34e199b9d'}),
    en:Object.freeze({src:translatedVideo('bc61f15e31ce9cd7c80e9c26b42733a5-en'),captions:localCaption('female','en'),heygenId:'bc61f15e31ce9cd7c80e9c26b42733a5-en'}),
    fr:Object.freeze({src:translatedVideo('d382b83f024bca61d9c6f01b8a2b205e-fr'),captions:localCaption('female','fr'),heygenId:'d382b83f024bca61d9c6f01b8a2b205e-fr'}),
    tr:Object.freeze({src:translatedVideo('798d3b066700329dcc9af65f108f0f25-tr'),captions:localCaption('female','tr'),heygenId:'798d3b066700329dcc9af65f108f0f25-tr'}),
    pl:Object.freeze({src:translatedVideo('9ebeaa1c966dd5fd172dcaa87762b76e-pl'),captions:localCaption('female','pl'),heygenId:'9ebeaa1c966dd5fd172dcaa87762b76e-pl'}),
    ru:Object.freeze({src:translatedVideo('6b7605af9bd4b00e94ef87687cb77fef-ru'),captions:localCaption('female','ru'),heygenId:'6b7605af9bd4b00e94ef87687cb77fef-ru'}),
    ar:Object.freeze({src:translatedVideo('b38b24215e3098ba71488398f00d9ef6-ar'),captions:localCaption('female','ar'),heygenId:'b38b24215e3098ba71488398f00d9ef6-ar'}),
    fa:Object.freeze({src:translatedVideo('4a6b11e35b527411eae2ddc3d069a980-fa_fa-IR'),captions:localCaption('female','fa'),heygenId:'4a6b11e35b527411eae2ddc3d069a980-fa_fa-IR'}),
    ro:Object.freeze({src:translatedVideo('c7b69797630d0ab1dcfa5ce8a73b6f6f-ro'),captions:localCaption('female','ro'),heygenId:'c7b69797630d0ab1dcfa5ce8a73b6f6f-ro'}),
    bg:Object.freeze({src:translatedVideo('0dd6febe2d931061970d623f7348cafa-bg'),captions:localCaption('female','bg'),heygenId:'0dd6febe2d931061970d623f7348cafa-bg'}),
    vi:Object.freeze({src:translatedVideo('9441354cb6f8be54b4a28406589ce204-vi_vi-VN'),captions:localCaption('female','vi'),heygenId:'9441354cb6f8be54b4a28406589ce204-vi_vi-VN'})
  }),
  male:Object.freeze({
    de:Object.freeze({src:'/videos/ash-workspace-gold-v134-male-de.mp4',captions:localCaption('male','de',134),heygenId:'9ec65c961112b2551e29fabfb0b6b347'}),
    en:Object.freeze({src:translatedVideo('175aad0bceae97fff367eb6835a7edd2-en'),captions:localCaption('male','en'),heygenId:'175aad0bceae97fff367eb6835a7edd2-en'}),
    fr:Object.freeze({src:translatedVideo('8159dbfba0c1e473503fc37ed6072b88-fr'),captions:localCaption('male','fr'),heygenId:'8159dbfba0c1e473503fc37ed6072b88-fr'}),
    tr:Object.freeze({src:translatedVideo('f1dc21effef1f3cfebd22cf310879b74-tr'),captions:localCaption('male','tr'),heygenId:'f1dc21effef1f3cfebd22cf310879b74-tr'}),
    pl:Object.freeze({src:translatedVideo('36a72e70bfaf4900a380bf525590b207-pl'),captions:localCaption('male','pl'),heygenId:'36a72e70bfaf4900a380bf525590b207-pl'}),
    ru:Object.freeze({src:translatedVideo('76187b3c9695463c8d22d3dde55e073e-ru'),captions:localCaption('male','ru'),heygenId:'76187b3c9695463c8d22d3dde55e073e-ru'}),
    ar:Object.freeze({src:translatedVideo('76187b3c9695463c8d22d3dde55e073e-ar'),captions:localCaption('male','ar'),heygenId:'76187b3c9695463c8d22d3dde55e073e-ar'}),
    fa:Object.freeze({src:translatedVideo('76187b3c9695463c8d22d3dde55e073e-fa_fa-IR'),captions:localCaption('male','fa'),heygenId:'76187b3c9695463c8d22d3dde55e073e-fa_fa-IR'}),
    ro:Object.freeze({src:translatedVideo('76187b3c9695463c8d22d3dde55e073e-ro'),captions:localCaption('male','ro'),heygenId:'76187b3c9695463c8d22d3dde55e073e-ro'}),
    bg:Object.freeze({src:translatedVideo('0bcf390cd5f3d1de3469722718f8d346-bg'),captions:localCaption('male','bg'),heygenId:'0bcf390cd5f3d1de3469722718f8d346-bg'}),
    vi:Object.freeze({src:translatedVideo('76187b3c9695463c8d22d3dde55e073e-vi_vi-VN'),captions:localCaption('male','vi'),heygenId:'76187b3c9695463c8d22d3dde55e073e-vi_vi-VN'})
  })
})

export function getExplainerVideo(language='de',presenter='female'){
  const presenterCatalog=explainerVideoCatalog[presenter]||explainerVideoCatalog.female
  return presenterCatalog[language]||presenterCatalog.de
}
