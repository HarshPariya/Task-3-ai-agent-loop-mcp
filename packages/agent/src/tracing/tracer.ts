import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { Span, SpanType, TokenUsage } from "./span.js";
import { workspaceRoot } from "../paths.js";


export class Tracer {
  private readonly roots: Span[] = [];
  private readonly spanMap = new Map<string, Span>();

  startSpan(
    name: string,
    type: SpanType,
    parentId?: string,
    input?: unknown
  ): Span {
    const span: Span = {
      id: randomUUID(),
      parentId,
      name,
      type,
      startTime: Date.now(),
      input,
      children: [],
    };

    this.spanMap.set(span.id, span);

    if (parentId) {
      const parent = this.spanMap.get(parentId);

      if (parent) {
        parent.children.push(span);
      } else {
        this.roots.push(span);
      }
    } else {
      this.roots.push(span);
    }

    return span;
  }

  endSpan(
    spanId: string,
    output?: unknown,
    tokens?: TokenUsage,
    estimatedCostUSD = 0
  ): void {
    const span = this.spanMap.get(spanId);

    if (!span) {
      return;
    }

    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.output = output;
    span.tokens = tokens;
    span.estimatedCostUSD = estimatedCostUSD;
  }

  exportTrace(
    fileName = "trace.json"
  ): void {
    const outputDir = join(workspaceRoot, "generated", "traces");

    mkdirSync(outputDir, {
      recursive: true,
    });

    const outputFile = join(outputDir, fileName);

    writeFileSync(
      outputFile,
      JSON.stringify(this.roots, null, 2),
      "utf8"
    );

    console.log(`Trace exported -> ${outputFile}`);
  }

  getRootSpans(): Span[] {
    return this.roots;
  }

  clear(): void {
    this.roots.length = 0;
    this.spanMap.clear();
  }
}