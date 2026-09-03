from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "testdaten" / "AS_Gold_Synthetischer_Testfall_V29.pdf"
FONT_REGULAR = "DejaVuSans"
FONT_BOLD = "DejaVuSans-Bold"


def build_pdf() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=17 * mm,
        bottomMargin=17 * mm,
        title="AS Workspace Gold - Synthetischer Testfall V29",
        author="AS Workspace Gold",
        subject="Ausschliesslich synthetische Testdaten fuer den kontrollierten App-Test",
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="GoldTitle",
            parent=styles["Title"],
            fontName=FONT_BOLD,
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#3E3218"),
            alignment=TA_LEFT,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="GoldLabel",
            parent=styles["Normal"],
            fontName=FONT_BOLD,
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#624B14"),
            alignment=TA_CENTER,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName=FONT_BOLD,
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#3A424C"),
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#2F353D"),
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#5F6873"),
        )
    )

    story = []
    badge = Table(
        [[Paragraph("SYNTHETISCHE TESTDATEN - KEINE ECHTEN PERSONEN", styles["GoldLabel"])]],
        colWidths=[170 * mm],
    )
    badge.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF1C9")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#C6A34A")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.extend([badge, Spacer(1, 8 * mm)])

    story.append(Paragraph("Muster-Schadenanzeige", styles["GoldTitle"]))
    story.append(
        Paragraph(
            "Dieses Dokument wurde ausschliesslich fuer den kontrollierten Test von AS Workspace Gold erstellt. "
            "Alle Namen, Nummern, Anschriften, Betraege und Ereignisse sind frei erfunden.",
            styles["Body"],
        )
    )

    meta = [
        ["Absender", "Musterwerk Nord UG (Test)", "Empfaenger", "Beispiel Versicherung AG (Test)"],
        ["Vorgang", "TEST-2026-0815", "Vertragsnummer", "SYN-4711-2026"],
        ["Dokumentdatum", "30.08.2026", "Antwortfrist", "15.09.2026"],
    ]
    table = Table(meta, colWidths=[31 * mm, 52 * mm, 33 * mm, 54 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7F5EE")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D8D4C8")),
                ("FONTNAME", (0, 0), (-1, -1), FONT_REGULAR),
                ("FONTNAME", (0, 0), (0, -1), FONT_BOLD),
                ("FONTNAME", (2, 0), (2, -1), FONT_BOLD),
                ("FONTSIZE", (0, 0), (-1, -1), 8.0),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#39414A")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([table, Spacer(1, 6 * mm)])

    story.append(Paragraph("Betreff: Synthetischer Wasserschaden am 15.08.2026", styles["Section"]))
    story.append(
        Paragraph(
            "Sehr geehrte Damen und Herren, am 15.08.2026 trat in einem frei erfundenen Lagerraum "
            "Wasser aus einer defekten Testleitung aus. Der Vorgang wurde am selben Tag um 09:30 Uhr "
            "entdeckt und fotografisch dokumentiert. Eine ebenfalls erfundene Fachfirma sperrte die Leitung "
            "um 10:15 Uhr ab.",
            styles["Body"],
        )
    )
    story.append(
        Paragraph(
            "Der vorlaeufige synthetische Schaden betraegt 12.450,00 EUR. Davon entfallen 7.800,00 EUR auf "
            "den Testbestand, 3.150,00 EUR auf Trocknung und 1.500,00 EUR auf Reinigung. Eine Zahlung ist "
            "nicht erfolgt. Bitte bestaetigen Sie den Eingang bis spaetestens 15.09.2026 und teilen Sie mit, "
            "welche weiteren Testunterlagen benoetigt werden.",
            styles["Body"],
        )
    )

    story.append(Paragraph("Beigefuegte Testhinweise", styles["Section"]))
    facts = [
        ["Zeitpunkt", "15.08.2026, 09:30 Uhr"],
        ["Gesamtbetrag", "12.450,00 EUR"],
        ["Referenz", "TEST-2026-0815 / SYN-4711-2026"],
        ["Frist", "15.09.2026"],
        ["Beweisstatus", "Fotos angekuendigt, aber in diesem Muster nicht beigefuegt"],
        ["Offener Punkt", "Deckung und genaue Schadenursache noch nicht geprueft"],
    ]
    facts_table = Table(facts, colWidths=[39 * mm, 131 * mm])
    facts_table.setStyle(
        TableStyle(
            [
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#F7F8F9")]),
                ("LINEBELOW", (0, 0), (-1, -2), 0.35, colors.HexColor("#DDE0E4")),
                ("FONTNAME", (0, 0), (0, -1), FONT_BOLD),
                ("FONTNAME", (1, 0), (1, -1), FONT_REGULAR),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#38414B")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(KeepTogether([facts_table, Spacer(1, 5 * mm)]))

    footer = Table(
        [[Paragraph(
            "TESTZWECK: Upload, Dokumenterkennung, Referenzen, Frist, Betrag, vorlaeufige Zusammenfassung "
            "und bewusste Freigabe pruefen. Das Ergebnis muss immer menschlich kontrolliert werden.",
            styles["Small"],
        )]],
        colWidths=[170 * mm],
    )
    footer.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF6EF")),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#A9C7AD")),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(footer)

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
