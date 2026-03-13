#pragma once

#include "JuceHeader.h"
#include "PluginProcessor.h"

//==============================================================================
class GhostSessionEditor : public juce::AudioProcessorEditor
{
public:
    explicit GhostSessionEditor(GhostSessionProcessor&);
    ~GhostSessionEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    GhostSessionProcessor& proc;

    // The entire UI is rendered in a WebView
    std::unique_ptr<juce::WebBrowserComponent> webView;

    // Build the URL to navigate to (includes auth token if available)
    juce::String getAppUrl() const;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(GhostSessionEditor)
};
