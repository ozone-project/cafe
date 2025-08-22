[Home](slide-01-title.md) | [Prev](slide-01-title.md) | [Next](slide-03-value-exchange-models.md) | [End](slide-16-appendix-research.md)

# The Content Value Matrix

Content is consumed by users and revenue is generated as follows:

```mermaid

flowchart LR
 subgraph Direct["Direct Channels"]
        App["App"]
        Web["Web"]
        Newsletter["Newsletter"]
        Podcast["Podcast"]
  end
 subgraph Indirect["Indirect Channels"]
        News["News Aggregator"]
        Social["Social"]
        Search["Search"]
        AI["AI"]
  end
 subgraph Revenue["Revenue Models"]
        Subscriptions["Subscriptions"]
        Advertising["Advertising"]
        Licensing["Licensing"]
  end
    Publisher["Publisher"] --> Article["Article"]
    Article --> Human["Human"] & Bot["Bot"]
    Human --> Direct
    Indirect --> Referrals["Referrals"] & Licensing
    Direct --> Subscriptions & Advertising
    Bot --> Indirect
    Referrals -.-> H2["Human"]
    style H2 stroke-width:2px,stroke-dasharray: 2,color:#616161

```

<div style="background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 16px; margin: 20px 0;">
<strong>Note:</strong> Over the past decade, user consumption patterns have fundamentally shifted from direct channels (where publishers maintain full control and revenue potential) to indirect channels (where third parties control the relationship and capture most of the value). This migration from direct to indirect consumption has created the revenue gap that threatens content sustainability.
</div>

