// All originals and replies below are invented. None is a captured customer
// response or independently reviewed legal advice. Expectations are written
// separately from the reply fixtures and do not call production calculators.
const owner='offline-synthetic-owner'
const referenceDate='2026-09-24T00:00:00Z'
const research=[
  {url:'https://fixtures.invalid/insurance-settlement',source_text:'FIKTIVE PRÜFQUELLE: Eine Kürzung der Versicherungsleistung wird anhand der vertraglichen Abrechnung erläutert.'},
  {url:'https://fixtures.invalid/health-contributions',source_text:'FIKTIVE PRÜFQUELLE: Diese Erläuterung betrifft ausschließlich Krankenversicherungsbeiträge auf Kapitalleistungen.'},
]
const none=[]
const sourceRef=url=>({url,quote:research.find(source=>source.url===url).source_text})
function original(id,text){return {id,title:id+'.txt',data_classification:'synthetic',extracted_text:'SYNTHETISCHER TESTFALL. '+text,updated_at:referenceDate}}
function calculation(id,expression,values,quote,documentId,topic='balance'){
  return {id,title:id,topic_ids:[topic],inputs:Object.entries(values).map(([name,value])=>({name,label:name,kind:'document',value,document_id:documentId,quote})),expression,decimal_places:2,unit:'EUR',conditions:'Rechnerischer Vergleich der ausdrücklich genannten Werte, keine Zusage eines Anspruchs.',explanation:'Die genannten Beträge werden anhand des angegebenen Rechenwegs abgeglichen.'}
}
function step(id,title,action,afterResponse,doneWhen,dependsOn=[],other={}){
  return {id,title,phase:dependsOn.length?'waiting':'now',light:'yellow',reason:title,owner:'Testperson',action,waiting_for:dependsOn.length?'Antwort auf die vorbereitete Anfrage.':'',after_response:afterResponse,done_when:doneWhen,follow_up:'Fehlende Antwort gezielt nachfordern; eine Wiedervorlage ist keine gesetzliche Frist.',depends_on:dependsOn,deadline:null,evidence:[],...other}
}
function fixture(id,title,documents,{topics,calculations,steps,letters=[],outputLanguage='de',referenceLanguage='de'}){
  const source={case:{id,title,owner_id:owner,home_country:'DE',target_country:'DE'},documents,assessments:[]}
  const reply={title,opening:topics[0].conclusion,key_points:[topics[0].conclusion],meaning:topics[0].conditions,next:steps[0].action,customer_action:steps[0].action,
    facts:documents.map(doc=>({text:doc.extracted_text,evidence:[{document_id:doc.id,quote:doc.extracted_text}]})),
    open_questions:topics.filter(topic=>topic.status!=='answered').map(topic=>({question:topic.conditions,who:'Zuständige Stelle',why:topic.conditions})),steps,letters,closing:'Synthetischer Referenzfall.',
    analysis:{topics,calculations,limitations:['Alle Personen, Dokumente und Prüfquellen sind erfunden. Dies ist keine neue KI-Auswertung.']}}
  return {id,title,provenance:'synthetic_reference',source,context:{outputLanguage,referenceLanguage,scope:{issues:topics.map(({id,title})=>({id,title})),research_topics:[]},research},reply}
}
const topic=(id,title,conclusion,conditions,stepIds,sources=[])=>({id,title,status:'conditional',conclusion,conditions,step_ids:stepIds,sources})
const required=(path,code,any,reason)=>({path,code,any,reason})
const forbidden=(path,code,none,reason)=>({path,code,none,reason})
const mutation=(id,code,path,value,provenance='synthetic_counterexample')=>({id,code,changes:[{path,value}],provenance})

const invoice=fixture('invoice','Werkstattrechnung',[
  original('invoice-original','Rechnung R-100: Gesamtbetrag 1.200,00 EUR. Bezahlt wurden 300,00 EUR. Der Reparaturauftrag fehlt.')
],{
  topics:[topic('balance','Rechnerisch offener Betrag','Rechnerisch bleiben 900,00 EUR. Ob die gesamte Rechnung geschuldet ist, bleibt ohne Reparaturauftrag offen.','Reparaturauftrag und ausgeführte Arbeiten abgleichen.',['request','review'])],
  calculations:[calculation('balance','total-paid',{total:'1200',paid:'300'},'Gesamtbetrag 1.200,00 EUR. Bezahlt wurden 300,00 EUR.','invoice-original')],
  steps:[
    step('request','Reparaturauftrag anfordern','Den Reparaturauftrag anfordern und den Versandnachweis ablegen.','Eingang der Unterlagen dokumentieren.','Anfrage versandt und Zugang belegt.'),
    step('review','Rechnungspositionen prüfen','Den Reparaturauftrag mit Rechnung und Zahlungsbeleg vergleichen.','Unvereinbarte oder doppelte Positionen schriftlich klären lassen.','Abweichungen erklärt oder konkret zur Klärung weitergegeben.',['request'])
  ]
})
invoice.expected={calculations:[{id:'balance',result:'900.00',unit:'EUR'}],topics:[{id:'balance',status:'conditional',allowed_sources:none}],steps:[{id:'request'},{id:'review',depends_on:['request']}],text:[required('steps.1.after_response','followup_action',['schriftlich klären'],'Bei Abweichungen muss eine konkrete Rückfrage folgen.')]}
invoice.counterexamples=[
  mutation('payment-added','calculation_result','analysis.calculations.0.expression','total+paid'),
  mutation('unsupported-input','production_validation','analysis.calculations.0.inputs.1.value','350'),
  mutation('no-response-action','followup_action','steps.1.after_response','Abweichungen markieren.')
]

const deposit=fixture('deposit','Mietkaution',[
  original('deposit-original','Kaution 1.500,00 EUR. Rückzahlung 250,00 EUR. Die Abrechnung der einbehaltenen Beträge fehlt.')
],{
  topics:[topic('balance','Einbehaltene Kaution','Die Differenz beträgt 1.250,00 EUR. Die Berechtigung des Einbehalts ist ungeklärt.','Abrechnung und Nachweise zu den Abzügen beschaffen.',['request','review'])],
  calculations:[calculation('balance','deposit-returned',{deposit:'1500',returned:'250'},'Kaution 1.500,00 EUR. Rückzahlung 250,00 EUR.','deposit-original')],
  steps:[
    step('request','Kautionsabrechnung anfordern','Abrechnung mit Belegen für alle Abzüge anfordern und den Zugang dokumentieren.','Die Abrechnung ablegen.','Anfrage zugegangen und dokumentiert.'),
    step('review','Abzüge einzeln abgleichen','Abrechnung, Rückzahlung und Übergabeprotokoll vergleichen.','Unbelegte Abzüge schriftlich beanstanden und eine Erläuterung verlangen.','Abzüge erklärt oder offene Positionen zur Klärung benannt.',['request'])
  ]
})
deposit.expected={calculations:[{id:'balance',result:'1250.00',unit:'EUR'}],topics:[{id:'balance',status:'conditional',allowed_sources:none}],steps:[{id:'review',depends_on:['request']}],text:[required('steps.0.action','missing_evidence',['Belegen für alle Abzüge'],'Die Anfrage muss die fehlenden Abzugsbelege benennen.')]}
deposit.counterexamples=[
  mutation('calculation-omitted','calculation_missing','analysis.calculations',[]),
  mutation('premature-entitlement','topic_status','analysis.topics.0.status','answered'),
  mutation('skip-request','dependency_missing','steps.1.depends_on',[])
]

const insurance=fixture('insurance','Versicherungsabrechnung',[
  original('insurance-original','Gemeldeter Schaden 2.500,00 EUR. Ausgezahlt 1.800,00 EUR. Eine Begründung für die Kürzung liegt nicht vor.')
],{
  topics:[topic('balance','Kürzung der Auszahlung','Die Differenz beträgt 700,00 EUR. Ob die Kürzung dem Vertrag entspricht, ist ungeklärt.','Abrechnung und konkrete Vertragsgrundlage der Kürzung beschaffen.',['request','review'],[sourceRef(research[0].url)])],
  calculations:[calculation('balance','claimed-paid',{claimed:'2500',paid:'1800'},'Gemeldeter Schaden 2.500,00 EUR. Ausgezahlt 1.800,00 EUR.','insurance-original')],
  steps:[
    step('request','Kürzungsbegründung anfordern','Die konkrete Vertragsklausel und vollständige Kürzungsberechnung anfordern.','Die Antwort mit dem Vertrag vergleichen.','Anfrage zugegangen und Nachweis abgelegt.'),
    step('review','Kürzung abgleichen','Begründung, Klausel und Rechnung gemeinsam prüfen.','Nicht erklärte Kürzungen mit einer konkreten Rückfrage klären lassen.','Kürzung erklärt oder strittige Position mit Belegen zur Prüfung weitergegeben.',['request'])
  ]
})
insurance.expected={calculations:[{id:'balance',result:'700.00',unit:'EUR'}],topics:[{id:'balance',status:'conditional',allowed_sources:[research[0].url],required_sources:[research[0].url]}],steps:[{id:'review',depends_on:['request']}],text:[required('steps.0.action','missing_evidence',['Vertragsklausel'],'Eine bloße Zusammenfassung ersetzt die fehlende Vertragsgrundlage nicht.')]}
insurance.counterexamples=[
  mutation('wrong-source-topic','source_relevance','analysis.topics.0.sources',[sourceRef(research[1].url)],'reconstructed_reported_failure'),
  mutation('no-source','source_missing','analysis.topics.0.sources',[]),
  mutation('wrong-subtraction','calculation_result','analysis.calculations.0.expression','paid-claimed')
]

const salary=fixture('salary','Lohnabrechnung',[
  original('salary-original','Bruttolohn 2.850,00 EUR, Steuerabzug 310,00 EUR, Sozialabzug 570,00 EUR. Überweisung 1.970,00 EUR. Die Erläuterung der Steuermerkmale fehlt.')
],{
  topics:[topic('balance','Auszahlungsabgleich','Die angegebenen Abzüge ergeben rechnerisch eine Auszahlung von 1.970,00 EUR; die Überweisung stimmt damit überein. Die Steuermerkmale bleiben gesondert zu klären.','Steuermerkmale und Abzugsgrundlage erläutern lassen.',['request'])],
  calculations:[calculation('net','gross-tax-social',{gross:'2850',tax:'310',social:'570'},'Bruttolohn 2.850,00 EUR, Steuerabzug 310,00 EUR, Sozialabzug 570,00 EUR.','salary-original')],
  steps:[step('request','Steuermerkmale klären','Die zugrunde gelegten Steuermerkmale bei der Abrechnungsstelle anfordern.','Eine abweichende Grundlage schriftlich berichtigen lassen.','Merkmale erläutert oder Berichtigungsanfrage zugegangen.')]
})
salary.expected={calculations:[{id:'net',result:'1970.00',unit:'EUR'}],topics:[{id:'balance',status:'conditional',allowed_sources:none}],steps:[{id:'request'}],text:[forbidden('analysis.topics.0.conclusion','calculation_contradiction',['erst danach können','noch nicht berechenbar'],'Offene Einordnung darf einen bereits möglichen Zahlenabgleich nicht als unmöglich darstellen.')]}
salary.counterexamples=[
  mutation('arithmetic-deferred','calculation_contradiction','analysis.topics.0.conclusion','Erst danach können Bruttobetrag, Abzüge und Auszahlungsbetrag rechnerisch abgestimmt werden.','reconstructed_reported_failure'),
  mutation('social-deduction-omitted','calculation_result','analysis.calculations.0.expression','gross-tax'),
  mutation('net-omitted','calculation_missing','analysis.calculations',[])
]

const authority=fixture('authority','Behördenpost mit neuer Frist',[
  original('authority-first','Vorgang A-100. Fehlende Unterlagen sind bis 12.10.2026 einzureichen.'),
  original('authority-reply','Vorgang A-100. Die Frist bis 12.10.2026 wurde auf den 20.10.2026 verlängert. Es fehlen weiterhin der Einkommensnachweis und die unterschriebene Erklärung.')
],{
  topics:[topic('documents','Unterlagen nachreichen','Die ausdrücklich verlängerte Einreichungsfrist ist der 20.10.2026. Die Entscheidung ist noch offen.','Einkommensnachweis und unterschriebene Erklärung nachreichen.',['prepare','submit','review'])],calculations:[],
  steps:[
    step('prepare','Unterlagen vorbereiten','Einkommensnachweis und unterschriebene Erklärung zusammenstellen.','Unterlagen auf Vollständigkeit prüfen.','Beide verlangten Unterlagen liegen geprüft vor.'),
    step('submit','Unterlagen einreichen','Die geprüften Unterlagen bis zur genannten Frist einreichen und einen Eingangsnachweis sichern.','Eingang bestätigen lassen.','Unterlagen eingereicht und Zugang belegt.',['prepare'],{deadline:{date:'2026-10-20',document_id:'authority-reply',quote:'Die Frist bis 12.10.2026 wurde auf den 20.10.2026 verlängert.'}}),
    step('review','Antwort prüfen','Die Entscheidung mit den eingereichten Unterlagen vergleichen.','Bei fehlender Berücksichtigung gezielt nachfragen.','Entscheidung geprüft und verbleibende Frage weitergegeben.',['submit'])
  ]
})
authority.expected={calculations:[],topics:[{id:'documents',status:'conditional',allowed_sources:none}],steps:[{id:'submit',depends_on:['prepare'],deadline:'2026-10-20'},{id:'review',depends_on:['submit']}],text:[required('steps.1.action','submission_missing',['einreichen'],'Zwischen Vorbereitung und Warten auf eine Entscheidung muss die Einreichung stehen.')]}
authority.counterexamples=[
  mutation('old-deadline','deadline','steps.1.deadline',{date:'2026-10-12',document_id:'authority-first',quote:'Fehlende Unterlagen sind bis 12.10.2026 einzureichen.'}),
  mutation('submission-skipped','submission_missing','steps.1.action','Die vorbereiteten Unterlagen ablegen.','reconstructed_reported_failure'),
  mutation('wait-before-submission','dependency_missing','steps.2.depends_on',['prepare'])
]

const energy=fixture('energy','Energieabrechnung ohne Restbetrag',[
  original('energy-original','Verbrauch 1.500 kWh. Preis 0,32 EUR je kWh. Grundpreis 120,00 EUR. Abschläge 600,00 EUR. Der Zählerstand ist noch mit dem Übergabeprotokoll abzugleichen.')
],{
  topics:[topic('balance','Abrechnung rechnerisch prüfen','Mit den angegebenen Werten ist der rechnerische Saldo 0,00 EUR. Ob der Verbrauch zutrifft, bleibt bis zum Zählerabgleich offen.','Zählerstand anhand von Protokoll und Ablesebeleg prüfen.',['reading'])],
  calculations:[calculation('balance','usage*price+base-paid',{usage:'1500',price:'0.32',base:'120',paid:'600'},'Verbrauch 1.500 kWh. Preis 0,32 EUR je kWh. Grundpreis 120,00 EUR. Abschläge 600,00 EUR.','energy-original')],
  steps:[step('reading','Zählerstand vergleichen','Den abgerechneten Zählerstand mit Übergabeprotokoll und Ablesebeleg vergleichen.','Bei Abweichung eine korrigierte Abrechnung anfordern.','Zählerstand belegt oder Korrektur mit Nachweis angefordert.')]
})
energy.expected={calculations:[{id:'balance',result:'0.00',unit:'EUR'}],topics:[{id:'balance',status:'conditional',allowed_sources:none}],steps:[{id:'reading'}],text:[required('steps.0.after_response','followup_action',['korrigierte Abrechnung anfordern'],'Eine festgestellte Abweichung muss zu einer konkreten Klärung führen.')]}
energy.counterexamples=[
  mutation('zero-hidden','calculation_missing','analysis.calculations',[]),
  mutation('base-price-omitted','calculation_result','analysis.calculations.0.expression','usage*price-paid'),
  mutation('foreign-quote','production_validation','facts.0.evidence.0.document_id','invoice-original')
]

const bilingual=fixture('bilingual','Englische Erklärung und deutscher Brief',[
  original('bilingual-original','Rechnung B-200: Gesamtbetrag 4.500,00 EUR. Zahlung 1.500,00 EUR. Die Leistungsaufstellung fehlt.')
],{
  topics:[topic('balance','Remaining amount','The arithmetic difference is EUR 3,000.00. Whether the invoice is fully justified remains open.','Obtain the itemized statement before assessing the disputed services.',['request','review'])],
  calculations:[calculation('balance','total-paid',{total:'4500',paid:'1500'},'Gesamtbetrag 4.500,00 EUR. Zahlung 1.500,00 EUR.','bilingual-original')],
  steps:[
    step('request','Request the statement','Review and send the German request; keep proof of receipt.','Save the itemized statement.','The request was sent and receipt is documented.'),
    step('review','Check the services','Compare the statement with the order and payment.','Request clarification of unsupported items.','Items are explained or specific questions have been sent.',['request'])
  ],
  letters:[{id:'request-letter',recipient:'Fiktive Rechnungsstelle',subject:'Bitte um Leistungsaufstellung – B-200',body:'Sehr geehrte Damen und Herren, bitte übersenden Sie die vollständige Leistungsaufstellung zur Rechnung B-200. Mit freundlichen Grüßen, Testperson',customer_translation:'Dear Sir or Madam, please send the complete itemized statement for invoice B-200. Kind regards, Test person',document_ids:['bilingual-original']}],outputLanguage:'en'
})
bilingual.expected={calculations:[{id:'balance',result:'3000.00',unit:'EUR'}],topics:[{id:'balance',status:'conditional',allowed_sources:none}],steps:[{id:'review',depends_on:['request']}],text:[required('letters.0.body','reference_language',['Sehr geehrte Damen und Herren'],'Der formale Referenzbrief muss deutsch bleiben.'),required('letters.0.customer_translation','customer_translation',['complete itemized statement'],'Die verständliche Kundenübersetzung muss die eigentliche Anfrage enthalten.')]}
bilingual.counterexamples=[
  mutation('translation-omitted','production_validation','letters.0.customer_translation',''),
  mutation('translation-incomplete','customer_translation','letters.0.customer_translation','Dear Sir or Madam. Kind regards.'),
  mutation('source-quote-translated','production_validation','facts.0.evidence.0.quote','Invoice B-200: total amount EUR 4,500.00.')
]

const family=fixture('family','Zwei Begünstigte und simulierte Folgeanträge',[
  original('family-payout','Kind A: Brutto 31.200 EUR, Lohnsteuer 3.000 EUR, Kirchensteuer 270 EUR, Auszahlung 27.930 EUR. Kind B: Brutto 31.800 EUR, Lohnsteuer 3.100 EUR, Kirchensteuer 279 EUR, Auszahlung 28.421 EUR. Die Versorgungsordnungen liegen nicht vor.'),
  original('family-duration','Statisches Rechenszenario: Kind A erhält monatlich 360 EUR über 60 Monate, Kind B monatlich 360 EUR über 90 Monate. Voraussetzungen und tatsächliche Bezugsdauer sind noch zu klären. Nur Testsimulation: kein Versand, keine Zahlung und keine echte Antragstellung.')
],{
  topics:[topic('benefits','Beträge je Kind','Die Auszahlungen beider Kinder lassen sich rechnerisch abgleichen. Die statischen Szenarien ergeben 21.600,00 EUR und 32.400,00 EUR. Die tatsächliche Anspruchsdauer ist damit nicht bestätigt.','Versorgungsordnungen, Voraussetzungen und laufende Bescheide abgleichen.',['orders','payments','application','answers','review'])],
  calculations:[
    calculation('net_a','gross-tax-church',{gross:'31200',tax:'3000',church:'270'},'Kind A: Brutto 31.200 EUR, Lohnsteuer 3.000 EUR, Kirchensteuer 270 EUR, Auszahlung 27.930 EUR.','family-payout','benefits'),
    calculation('net_b','gross-tax-church',{gross:'31800',tax:'3100',church:'279'},'Kind B: Brutto 31.800 EUR, Lohnsteuer 3.100 EUR, Kirchensteuer 279 EUR, Auszahlung 28.421 EUR.','family-payout','benefits'),
    calculation('duration_a','monthly*months',{monthly:'360',months:'60'},'Kind A erhält monatlich 360 EUR über 60 Monate','family-duration','benefits'),
    calculation('duration_b','monthly*months',{monthly:'360',months:'90'},'Kind B monatlich 360 EUR über 90 Monate.','family-duration','benefits')
  ],
  steps:[
    step('prepare','Simulation vorbereiten','Die vorhandenen Testunterlagen ordnen.','Fehlende Unterlagen in der Simulation benennen.','Testunterlagen vollständig zugeordnet.'),
    step('orders','Versorgungsordnungen beschaffen','Die Anfrage nach beiden Versorgungsordnungen simulieren.','Die simulierte Antwort dem jeweiligen Kind zuordnen.','Beide simulierten Ordnungen sind zugeordnet.',['prepare']),
    step('payments','Zahlungslücken klären','Die monatlichen Zahlungen je Kind im Test abgleichen.','Bei einer Zahlungslücke eine konkrete Klärungsanfrage an den zuständigen Träger simulieren.','Lücken erklärt oder die simulierte Klärungsanfrage dokumentiert.',['prepare']),
    step('application','Folgeanträge simulieren','Die Folgeanträge vorbereiten und ihre Einreichung simulieren; keinen echten Antrag absenden.','Simulierten Eingang und Antworten je Kind zuordnen.','Simulierte Einreichung und simulierter Zugang sind dokumentiert.',['prepare']),
    step('answers','Antworten zusammenführen','Die drei simulierten Antworten mit den ursprünglichen Fragen vergleichen.','Unbeantwortete Punkte in einer konkreten weiteren Anfrage simulieren.','Alle drei Antworten geprüft und offene Fragen weitergegeben.',['orders','payments','application'],{waiting_for:'Antworten aus Schritten 2 bis 4.'}),
    step('review','Ergebnisse je Kind prüfen','Bedingte Rechenszenarien getrennt von bestätigten Bescheiden ausweisen.','Bei Widersprüchen eine gezielte Klärungsanfrage simulieren.','Jedes Kind vollständig abgeglichen; offene Voraussetzungen ausdrücklich benannt.',['answers'])
  ]
})
family.expected={calculations:[{id:'net_a',result:'27930.00',unit:'EUR'},{id:'net_b',result:'28421.00',unit:'EUR'},{id:'duration_a',result:'21600.00',unit:'EUR'},{id:'duration_b',result:'32400.00',unit:'EUR'}],topics:[{id:'benefits',status:'conditional',allowed_sources:none}],steps:[{id:'answers',depends_on:['orders','payments','application']},{id:'review',depends_on:['answers']}],text:[
  required('steps.2.after_response','followup_action',['Klärungsanfrage'],'Zahlungslücken erfordern eine konkrete Klärungsanfrage.'),
  required('steps.3.action','submission_missing',['Einreichung simulieren'],'Auch die Simulation braucht eine Einreichung vor der Antwort.'),
  forbidden('analysis.topics.0.conclusion','calculation_contradiction',['erst danach können'],'Bekannte Werte dürfen nicht als noch unberechenbar beschrieben werden.')
]}
family.counterexamples=[
  mutation('middle-dependency-omitted','dependency_missing','steps.4.depends_on',['orders','application'],'reconstructed_reported_failure'),
  mutation('payment-gap-only-marked','followup_action','steps.2.after_response','Zahlungslücken markieren.','reconstructed_reported_failure'),
  mutation('application-prepared-not-submitted','submission_missing','steps.3.action','Die Folgeanträge vorbereiten und auf die simulierten Bescheide warten.','reconstructed_reported_failure'),
  mutation('contribution-source-for-private-entitlement','source_relevance','analysis.topics.0.sources',[sourceRef(research[1].url)],'reconstructed_reported_failure'),
  mutation('second-beneficiary-omitted','calculation_missing','analysis.calculations',family.reply.analysis.calculations.filter(item=>item.id.endsWith('_a')))
]
// This unambiguous graph omission is repaired by production validation itself.
family.counterexamples[0].behavior='corrected'

export const offlineFixtures=[invoice,deposit,insurance,salary,authority,energy,bilingual,family]
