import React, { useState, useEffect } from "react";
import { Loader } from "semantic-ui-react";
import useDimensions from "react-cool-dimensions";
const { Graph } = require("react-d3-graph");
import { fetchSocialGraph } from "../../actions/peopleActions";
import { useAppSelector, useAppDispatch } from "../../hooks";
type Props = {
  height: number;
};
export const SocialGraph = (props: Props) => {
  const { observe, width } = useDimensions({
    onResize: ({ observe, unobserve, width, height, entry }) => {
      observe();
    },
  });

  const dispatch = useAppDispatch();
  const { socialGraph, fetchedSocialGraph } = useAppSelector(
    (state) => state.people
  );

  useEffect(() => {
    if (!fetchedSocialGraph) {
      fetchSocialGraph(dispatch);
    }
  }, [dispatch]); // Only run on first render

  var myConfig = {
    automaticRearrangeAfterDropNode: false,
    staticGraph: true,
    nodeHighlightBehavior: true,
    maxZoom: 4,
    minZoom: 0.1,
    node: {
      fontSize: 10,
      size: 500,
      color: "lightblue",
      highlightFontSize: 15,
      highlightStrokeColor: "orange",
    },
    link: {
      highlightColor: "orange",
      color: "#12939A",
    },
    height: props.height,
    width: width,
  };
  var graph;
  if (fetchedSocialGraph && socialGraph.nodes.length > 0) {
    graph = <Graph id="social-graph" config={myConfig} data={socialGraph} />;
  } else {
    graph = <Loader active>Fetching Social Graph</Loader>;
  }
  return <div ref={observe}>{graph}</div>;
};

export default SocialGraph;
