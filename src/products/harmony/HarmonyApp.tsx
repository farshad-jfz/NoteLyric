"use client";

import { useEffect, useMemo, useState } from "react";

import ScoreViewer from "@/components/ScoreViewer";
import PageHeader from "@/components/ui/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import { useMetronome } from "@/components/metronome/MetronomeProvider";
import { ROOT_OPTIONS } from "@/lib/music/constants";
import { exerciseToMusicXml } from "@/lib/music/xmlBuilder";
import {
  buildHarmonyExercise,
  chordsForProgression,
  HARMONY_PROGRESSIONS,
  HARMONY_SCALE_TYPES,
  harmonizeScale,
  type ArpeggioDirection,
  type HarmonyChord,
  type HarmonyScaleType
} from "@/products/harmony/theory";

type HarmonyTab = "scale-harmony" | "functions" | "progressions" | "arpeggios";

type TabInfo = {
  id: HarmonyTab;
  label: string;
};

const TABS: TabInfo[] = [
  { id: "scale-harmony", label: "Scale Harmony" },
  { id: "functions", label: "Chord Functions" },
  { id: "progressions", label: "Progressions" },
  { id: "arpeggios", label: "Arpeggio Practice" }
];

const FUNCTION_ORDER = ["Tonic", "Predominant", "Dominant", "Color"] as const;

export default function HarmonyApp() {
  const [activeTab, setActiveTab] = useState<HarmonyTab>("scale-harmony");
  const [keyCenter, setKeyCenter] = useState("C");
  const [scaleType, setScaleType] = useState<HarmonyScaleType>("Major");
  const [selectedDegree, setSelectedDegree] = useState(1);
  const [progressionId, setProgressionId] = useState("ii-v-i");
  const [arpeggioMode, setArpeggioMode] = useState<"single" | "scale" | "progression">("single");
  const [direction, setDirection] = useState<ArpeggioDirection>("Up and Down");
  const { bpm, setBpm } = useMetronome();

  const harmony = useMemo(() => harmonizeScale(keyCenter, scaleType), [keyCenter, scaleType]);
  const selectedChord = harmony[selectedDegree - 1] ?? harmony[0];
  const progressionData = useMemo(() => chordsForProgression(keyCenter, scaleType, progressionId), [keyCenter, progressionId, scaleType]);

  const activeExercise = useMemo(() => {
    if (activeTab === "progressions") {
      return buildHarmonyExercise({
        title: `${keyCenter} ${progressionData.progression.name}`,
        key: keyCenter,
        scaleType,
        chords: progressionData.chords,
        mode: "block",
        tempo: 90
      });
    }

    if (activeTab === "arpeggios") {
      const chords = arpeggioMode === "scale" ? harmony : arpeggioMode === "progression" ? progressionData.chords : [selectedChord];
      const label = arpeggioMode === "scale" ? `${keyCenter} ${scaleType} Scale Harmony` : arpeggioMode === "progression" ? progressionData.progression.name : selectedChord.symbol;
      return buildHarmonyExercise({
        title: `${label} Arpeggios`,
        key: keyCenter,
        scaleType,
        chords,
        mode: "arpeggio",
        direction,
        noteValue: "quarter",
        tempo: 90
      });
    }

    return buildHarmonyExercise({
      title: `${selectedChord.symbol} Arpeggio`,
      key: keyCenter,
      scaleType,
      chords: [selectedChord],
      mode: "arpeggio",
      direction: "Ascending",
      tempo: 90
    });
  }, [activeTab, arpeggioMode, direction, harmony, keyCenter, progressionData, scaleType, selectedChord]);

  const musicXml = useMemo(() => exerciseToMusicXml(activeExercise), [activeExercise]);

  useEffect(() => {
    if (bpm === 90) return;
    setBpm(90);
  }, [bpm, setBpm]);

  const groupedByFunction = useMemo(() => {
    return FUNCTION_ORDER.map((functionName) => ({
      functionName,
      chords: harmony.filter((chord) => chord.functionName === functionName)
    })).filter((group) => group.chords.length > 0);
  }, [harmony]);

  return (
    <>
      <PageHeader
        eyebrow="Harmony"
        title="Harmony Lab"
        description="Learn where chords come from, what they do, how they move, and how to outline them with arpeggios."
        actions={
          <div className="button-row">
            <span className="chip">{keyCenter} {scaleType}</span>
            <span className="chip">Metronome {bpm} bpm</span>
          </div>
        }
      />

      <SectionCard title="Harmony Controls" description="Choose a harmonic world, then move through the tabs from chord construction to practical playing." accent>
        <div className="harmony-controls">
          <div className="harmony-tabs" role="tablist" aria-label="Harmony sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "harmony-tab harmony-tab--active" : "harmony-tab"}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="field-grid">
            <label>
              <span>Key</span>
              <select value={keyCenter} onChange={(event) => setKeyCenter(event.target.value)}>
                {ROOT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Scale type</span>
              <select value={scaleType} onChange={(event) => setScaleType(event.target.value as HarmonyScaleType)}>
                {HARMONY_SCALE_TYPES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </SectionCard>

      {activeTab === "scale-harmony" ? <ScaleHarmonyView chords={harmony} selectedChord={selectedChord} onSelect={setSelectedDegree} musicXml={musicXml} /> : null}
      {activeTab === "functions" ? <FunctionView groups={groupedByFunction} onSelect={setSelectedDegree} /> : null}
      {activeTab === "progressions" ? (
        <ProgressionView
          selectedId={progressionId}
          onSelect={setProgressionId}
          progression={progressionData.progression}
          chords={progressionData.chords}
          musicXml={musicXml}
        />
      ) : null}
      {activeTab === "arpeggios" ? (
        <ArpeggioView
          mode={arpeggioMode}
          onModeChange={setArpeggioMode}
          direction={direction}
          onDirectionChange={setDirection}
          selectedChord={selectedChord}
          progressionName={progressionData.progression.name}
          musicXml={musicXml}
        />
      ) : null}
    </>
  );
}

function ScaleHarmonyView({ chords, selectedChord, onSelect, musicXml }: { chords: HarmonyChord[]; selectedChord: HarmonyChord; onSelect: (degree: number) => void; musicXml: string }) {
  return (
    <section className="harmony-workspace">
      <SectionCard title="Diatonic Seventh Chords" description="Each chord is built by stacking thirds from the selected scale.">
        <div className="harmony-chord-grid">
          {chords.map((chord) => (
            <button key={chord.degree} type="button" className={chord.degree === selectedChord.degree ? "harmony-chord-card is-selected" : "harmony-chord-card"} onClick={() => onSelect(chord.degree)}>
              <span>{chord.roman}</span>
              <strong>{chord.symbol}</strong>
              <small>{chord.quality}</small>
            </button>
          ))}
        </div>
      </SectionCard>

      <ChordDetail chord={selectedChord} musicXml={musicXml} />
    </section>
  );
}

function ChordDetail({ chord, musicXml }: { chord: HarmonyChord; musicXml: string }) {
  return (
    <SectionCard title={`${chord.symbol} Detail`} description="Chord spelling, harmonic function, and a playable arpeggio." accent>
      <div className="harmony-detail-grid">
        <div className="harmony-fact-list">
          <div><span>Degree</span><strong>{chord.roman}</strong></div>
          <div><span>Chord tones</span><strong>{chord.tones.join(" ")}</strong></div>
          <div><span>Function</span><strong>{chord.functionName}</strong></div>
          <div><span>Resolution</span><strong>{chord.resolution}</strong></div>
        </div>
        <div className="progression-strip">
          <p className="progression-strip__label">Improvisation focus</p>
          <p className="progression-strip__value">{chord.improvisationFocus}</p>
        </div>
      </div>
      <ScoreViewer musicXml={musicXml} hideHeader />
    </SectionCard>
  );
}

function FunctionView({ groups, onSelect }: { groups: Array<{ functionName: string; chords: HarmonyChord[] }>; onSelect: (degree: number) => void }) {
  return (
    <SectionCard title="Chord Functions" description="Harmony becomes useful when you understand what each chord does." accent>
      <div className="harmony-function-grid">
        {groups.map((group) => (
          <section key={group.functionName} className="harmony-function-card">
            <h3>{group.functionName}</h3>
            <p>{group.chords[0]?.functionDescription}</p>
            <div className="harmony-pill-row">
              {group.chords.map((chord) => (
                <button key={chord.degree} type="button" className="button button--ghost" onClick={() => onSelect(chord.degree)}>
                  {chord.roman} {chord.symbol}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SectionCard>
  );
}

function ProgressionView({ selectedId, onSelect, progression, chords, musicXml }: { selectedId: string; onSelect: (id: string) => void; progression: { name: string; roman: string; description: string; category: string }; chords: HarmonyChord[]; musicXml: string }) {
  return (
    <section className="harmony-workspace">
      <SectionCard title="Progression Library" description="Start with cadences, then move into functional and popular progressions.">
        <div className="harmony-progression-list">
          {HARMONY_PROGRESSIONS.map((item) => (
            <button key={item.id} type="button" className={item.id === selectedId ? "listing-button is-selected" : "listing-button"} onClick={() => onSelect(item.id)}>
              <strong>{item.name}</strong>
              <small>{item.roman} - {item.category}</small>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={progression.name} description={progression.description} accent>
        <div className="guided-overview__summary">
          <div className="guided-overview__summary-item"><span>Roman</span><strong>{progression.roman}</strong></div>
          <div className="guided-overview__summary-item"><span>Chords</span><strong>{chords.map((chord) => chord.symbol).join(" - ")}</strong></div>
          <div className="guided-overview__summary-item"><span>Function flow</span><strong>{chords.map((chord) => chord.functionName).join(" -> ")}</strong></div>
        </div>
        <ScoreViewer musicXml={musicXml} hideHeader />
      </SectionCard>
    </section>
  );
}

function ArpeggioView({ mode, onModeChange, direction, onDirectionChange, selectedChord, progressionName, musicXml }: { mode: "single" | "scale" | "progression"; onModeChange: (mode: "single" | "scale" | "progression") => void; direction: ArpeggioDirection; onDirectionChange: (direction: ArpeggioDirection) => void; selectedChord: HarmonyChord; progressionName: string; musicXml: string }) {
  return (
    <SectionCard title="Arpeggio Practice" description="Turn harmonic understanding into something playable." accent>
      <div className="harmony-controls">
        <div className="harmony-tabs" role="tablist" aria-label="Arpeggio modes">
          {([
            ["single", `Single chord: ${selectedChord.symbol}`],
            ["scale", "Scale harmony"],
            ["progression", progressionName]
          ] as const).map(([value, label]) => (
            <button key={value} type="button" className={mode === value ? "harmony-tab harmony-tab--active" : "harmony-tab"} onClick={() => onModeChange(value)}>{label}</button>
          ))}
        </div>
        <label className="field">
          <span>Direction</span>
          <select value={direction} onChange={(event) => onDirectionChange(event.target.value as ArpeggioDirection)}>
            <option>Ascending</option>
            <option>Descending</option>
            <option>Up and Down</option>
          </select>
        </label>
      </div>
      <ScoreViewer musicXml={musicXml} hideHeader />
    </SectionCard>
  );
}
